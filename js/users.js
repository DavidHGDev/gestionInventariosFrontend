const URL_API = 'http://localhost:3007/api/users';
const token = sessionStorage.getItem('token');

// 1. EL GUARDIA
if (!token) window.location.href = '/index.html';

// 2. ELEMENTOS DEL DOM
const usersTableBody = document.getElementById('usersTableBody');
const modal = document.getElementById('userModal');
const userForm = document.getElementById('userForm');
const modalTitle = document.getElementById('modalTitle');
const formError = document.getElementById('formError');
const passwordInput = document.getElementById('password');
const passwordHelp = document.getElementById('passwordHelp');

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    cargarUsuarios();
    
    // Configurar menú móvil (reutilizado)
    document.getElementById('btnOpenMenu').addEventListener('click', () => document.getElementById('sidebar').classList.add('active'));
    document.getElementById('btnCloseMenu').addEventListener('click', () => document.getElementById('sidebar').classList.remove('active'));
    document.getElementById('btnLogout').addEventListener('click', () => {
        sessionStorage.removeItem('token');
        window.location.href = '/index.html';
    });
});

// ==========================================
// R: READ (LEER USUARIOS)
// ==========================================
async function cargarUsuarios() {
    try {
        const respuesta = await fetch(URL_API, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!respuesta.ok) throw new Error("No tienes permisos o el token expiró");

        const usuarios = await respuesta.json();
        dibujarTabla(usuarios);
    } catch (error) {
        console.error(error);
        alert("Error al cargar usuarios. Inicia sesión nuevamente.");
        sessionStorage.removeItem('token');
        window.location.href = '/login.html';
    }
}

function dibujarTabla(usuarios) {
    usersTableBody.innerHTML = ''; // Limpiamos la tabla
    
    if(usuarios.length === 0) {
        usersTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No hay usuarios registrados</td></tr>`;
        return;
    }

    usuarios.forEach(user => {
        // Tu idea brillante: El booleano isActive
        const estadoHTML = user.isActive 
            ? `<span class="badge-active">Activo</span>` 
            : `<span class="badge-inactive">Inactivo</span>`;

        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>#${user.id}</td>
            <td><strong>${user.name} ${user.lastName || ''}</strong></td>
            <td>${user.email}</td>
            <td>${user.role}</td>
            <td>${estadoHTML}</td>
            <td>
                <button class="action-btn btn-edit" onclick="abrirModalEdicion(${user.id})" title="Editar">✏️</button>
                <button class="action-btn btn-toggle" onclick="cambiarEstado(${user.id}, ${user.isActive})" title="Activar/Desactivar">🚫</button>
                <button class="action-btn btn-delete" onclick="eliminarUsuario(${user.id})" title="Eliminar Definitivamente">🗑️</button>
            </td>
        `;
        usersTableBody.appendChild(fila);
    });
}

// ==========================================
// C & U: CREATE Y UPDATE (MODAL Y FORMULARIO)
// ==========================================
document.getElementById('btnNewUser').addEventListener('click', () => {
    userForm.reset();
    document.getElementById('userId').value = ''; // ID vacío significa "Crear"
    modalTitle.textContent = 'Nuevo Usuario';
    
    // Si es nuevo, la contraseña es obligatoria
    passwordInput.required = true;
    passwordHelp.style.display = 'none';
    formError.style.display = 'none';
    
    modal.classList.add('active');
});

// Función global para poder llamarla desde el botón "onclick" de la tabla
window.abrirModalEdicion = async (id) => {
    try {
        const respuesta = await fetch(`${URL_API}/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await respuesta.json();

        // Llenar el formulario
        document.getElementById('userId').value = user.id;
        document.getElementById('name').value = user.name;
        document.getElementById('lastName').value = user.lastName || '';
        document.getElementById('email').value = user.email;
        document.getElementById('role').value = user.role;
        
        // Si edita, la contraseña no es obligatoria
        passwordInput.value = '';
        passwordInput.required = false;
        passwordHelp.style.display = 'block';
        
        modalTitle.textContent = 'Editar Usuario';
        formError.style.display = 'none';
        modal.classList.add('active');

    } catch (error) {
        alert("Error al obtener los datos del usuario");
    }
};

// Cerrar Modal
const cerrarModal = () => modal.classList.remove('active');
document.getElementById('btnCloseModal').addEventListener('click', cerrarModal);
document.getElementById('btnCancel').addEventListener('click', cerrarModal);

// Submit del Formulario (Crear o Actualizar)
userForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.style.display = 'none';
    
    const formData = new FormData(userForm);
    const datos = Object.fromEntries(formData);
    const idUsuario = datos.id; 

    // Si la contraseña está vacía (en edición), la quitamos para que Zod/Prisma no estallen
    if (!datos.password) delete datos.password;

    // Decidir si es POST (Crear) o PATCH (Actualizar)
    const metodoHTTP = idUsuario ? 'PATCH' : 'POST';
    const urlFinal = idUsuario ? `${URL_API}/${idUsuario}` : URL_API;

    try {
        const respuesta = await fetch(urlFinal, {
            method: metodoHTTP,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            formError.textContent = resultado.message || resultado.errors[0].message;
            formError.style.display = 'block';
            return;
        }

        cerrarModal();
        cargarUsuarios(); // Recargar la tabla
        alert(`Usuario ${idUsuario ? 'actualizado' : 'creado'} con éxito`);

    } catch (error) {
        formError.textContent = "Error de conexión con el servidor";
        formError.style.display = 'block';
    }
});

// ==========================================
// D: DELETE Y SOFT DELETE (ELIMINAR/DESACTIVAR)
// ==========================================
window.cambiarEstado = async (id, estadoActual) => {
    if (!confirm(`¿Estás seguro de querer ${estadoActual ? 'desactivar' : 'activar'} a este empleado?`)) return;

    try {
        // Aprovechamos la ruta PATCH para enviar solo el isActive invertido
        await fetch(`${URL_API}/${id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ isActive: !estadoActual })
        });
        cargarUsuarios();
    } catch (error) {
        alert("Error al cambiar el estado");
    }
};

window.eliminarUsuario = async (id) => {
    if (!confirm("ATENCIÓN: Esto eliminará el registro de la base de datos permanentemente. ¿Continuar?")) return;

    try {
        const respuesta = await fetch(`${URL_API}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (respuesta.ok) cargarUsuarios();
        else alert("Error al eliminar el usuario. Puede que tenga datos relacionados.");
    } catch (error) {
        alert("Error de conexión");
    }
};