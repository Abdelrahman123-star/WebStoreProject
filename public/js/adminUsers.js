  // Basic modal open/close logic:
  document.querySelectorAll('.edit').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = document.getElementById('editUserModal');
      document.getElementById('editUserId').value = btn.dataset.id;
      document.getElementById('editUsername').value = btn.dataset.username;
      document.getElementById('editEmail').value = btn.dataset.email;
      document.getElementById('editRole').value = btn.dataset.role;
      document.getElementById('editStreet').value = btn.dataset.street;
      document.getElementById('editCity').value = btn.dataset.city;
      document.getElementById('editPhone').value = btn.dataset.phone;

      document.getElementById('editPassword').style.display="none";
      document.getElementById('passwordLabel').style.display="none";

      document.getElementById('addoreditUser').innerHTML="Edit User"
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('active'), 10);
    });
  });






//Add user form
   document.querySelectorAll('.add-product').forEach(btn => {
    btn.addEventListener('click', () => {

      document.getElementById('editUserForm').setAttribute("action", "/admin/users/create");
      document.getElementById('addoreditUser').innerHTML="Add User"
      document.getElementById('editPassword').style.display="display";
      document.getElementById('passwordLabel').style.display="display";

      const modal = document.getElementById('editUserModal');
      modal.style.display = 'flex';
      setTimeout(() => modal.classList.add('active'), 10);
    });
  });
   
  document.getElementById('closeModal').onclick = () => {
    const modal = document.getElementById('editUserModal');
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
  };


    window.onclick = (e) => {
    const modal = document.getElementById('editUserModal');
    if(e.target === modal) {
      modal.classList.remove('active');
      setTimeout(() => modal.style.display = 'none', 300);
    }
  };