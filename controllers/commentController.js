const Comment = require('../models/Comment');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// Get all comments (admin)
exports.getAllComments = async (req, res) => {
    try {
        // Check database connection
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database connection not ready');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;

        // Fetch comments with proper error handling
        let comments;
        try {
            comments = await Comment.find()
                .populate({
                    path: 'user',
                    select: 'username',
                    model: 'Users'
                })
                .populate({
                    path: 'product',
                    select: 'name',
                    model: 'Product'
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            // Filter out comments where product or user is null
            comments = comments.filter(comment => comment.product && comment.user);


        } catch (populateError) {
            console.error('Error populating comments:', populateError);
            throw new Error('Error fetching comment details');
        }

        // Get total count
        const totalComments = await Comment.countDocuments();
        const totalPages = Math.ceil(totalComments / limit);

        // Render the view with the data
        res.render('admin/comments', {
            user: req.session.user,
            activePage: 'comments',
            comments: comments || [],
            currentPage: page,
            totalPages,
            messages: {
                success: req.flash('success'),
                error: req.flash('error')
            }
        });
    } catch (error) {
        console.error('Error in getAllComments:', error);
        
        // Send error response
        req.flash('error', 'Failed to load comments: ' + error.message);
        res.render('admin/comments', {
            user: req.session.user,
            activePage: 'comments',
            comments: [],
            currentPage: 1,
            totalPages: 1,
            messages: {
                success: [],
                error: ['Failed to load comments. Please try again later.']
            }
        });
    }
};

// Add a new comment (user)
exports.addComment = async (req, res) => {
    try {
        const { productId, content, rating } = req.body;
        
        if (!req.session.user) {
            return res.status(401).json({ error: 'Please login to comment' });
        }

        // Validate input
        if (!productId || !content || !rating) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Create new comment
        const newComment = new Comment({
            user: req.session.user.id,
            product: productId,
            content,
            rating: parseInt(rating),
            status: 'pending'
        });

        // Save the comment
        await newComment.save();

        // Add comment to product's comments array
        product.comments.push(newComment._id);
        await product.save();

        // Update product rating
        const approvedComments = await Comment.find({ 
            product: productId,
            status: 'approved'
        });
        
        if (approvedComments.length > 0) {
            const averageRating = approvedComments.reduce((acc, comment) => acc + comment.rating, 0) / approvedComments.length;
            product.rating = averageRating;
            product.numberOfReviews = approvedComments.length;
            await product.save();
        }

        res.json({ 
            success: true, 
            message: 'Comment added successfully and is pending approval' 
        });
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
};

// Update comment status (admin)
exports.updateCommentStatus = async (req, res) => {
    try {
            const { commentId } = req.params;  // Changed from req.body to req.params
        const { status } = req.body;
        
        console.log('Updating comment:', { commentId, status }); // Debug log

        if (!mongoose.Types.ObjectId.isValid(commentId)) {
            return res.status(400).json({ error: 'Invalid comment ID' });
        }

        const comment = await Comment.findById(commentId);
        console.log('Found comment:', comment); // Debug log

        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }

        comment.status = status;
        await comment.save();

        // Update product rating if comment status changed
        if (status === 'approved' || status === 'rejected') {
            const product = await Product.findById(comment.product);
            if (product) {
                const comments = await Comment.find({ 
                    product: comment.product,
                    status: 'approved'
                });
                
                if (comments.length > 0) {
                    const averageRating = comments.reduce((acc, comment) => acc + comment.rating, 0) / comments.length;
                    product.rating = averageRating;
                    product.numberOfReviews = comments.length;
                } else {
                    product.rating = 0;
                    product.numberOfReviews = 0;
                }
                await product.save();
            }
        }

        req.flash('success', 'Comment status updated successfully');
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating comment status:', error);
        res.status(500).json({ error: 'Failed to update comment status' });
    }
};

// Delete comment (admin)
exports.deleteComment = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Deleting comment:', id); // Debug log

        if (!mongoose.Types.ObjectId.isValid(id)) {
            req.flash('error', 'Invalid comment ID');
            return res.redirect('/admin/comments');
        }

        const comment = await Comment.findById(id);
        console.log('Found comment to delete:', comment); // Debug log

        if (!comment) {
            req.flash('error', 'Comment not found');
            return res.redirect('/admin/comments');
        }

        // Remove comment from product's comments array
        const product = await Product.findById(comment.product);
        if (product) {
            product.comments = product.comments.filter(c => c.toString() !== comment._id.toString());
            await product.save();

            // Update product rating
            const comments = await Comment.find({ 
                product: comment.product,
                status: 'approved'
            });
            
            if (comments.length > 0) {
                const averageRating = comments.reduce((acc, comment) => acc + comment.rating, 0) / comments.length;
                product.rating = averageRating;
                product.numberOfReviews = comments.length;
            } else {
                product.rating = 0;
                product.numberOfReviews = 0;
            }
            await product.save();
        }

        // Delete the comment
        await Comment.findByIdAndDelete(id);

        req.flash('success', 'Comment deleted successfully');
        res.redirect('/admin/comments');
    } catch (error) {
        console.error('Error deleting comment:', error);
        req.flash('error', 'Failed to delete comment');
        res.redirect('/admin/comments');
    }
}; 