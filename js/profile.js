import { verificarAutenticacion, cerrarSesion } from './utils/auth.js';

const token = verificarAutenticacion();
const URL_API = 'http://localhost:3007/api/users';

// Extraer ID del Token
function obtenerMiIdDelToken() {
    try {
        const payloadBase64 = token.split('.')[1];
        const decodificado = JSON.parse(atob(payloadBase64));
        return decodificado.id; 
    } catch (error) {
        return null;
    }
}

const miId = obtenerMiIdDelToken();
if (!miId) cerrarSesion();

// DOM Elements
const profileForm = document.getElementById('profileForm');
const formError = document.getElementById('formError');
const btnSaveProfile = document.getElementById('btnSaveProfile');

// Cabecera del perfil
const avatarInitials = document.getElementById('avatarInitials');
const profileFullName = document.getElementById('profileFullName');
const profileEmail = document.getElementById('profileEmail');
const profileRole = document.getElementById('profileRole');

document.addEventListener('DOMContentLoaded', () => {
    cargarMiPerfil();
    
    document.getElementById('btnOpenMenu').addEventListener('click', () => document.getElementById('sidebar').classList.add('active'));
    document.getElementById('btnCloseMenu').addEventListener('click', () => document.getElementById('sidebar').classList.remove('active'));
    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
});

async function cargarMiPerfil() {
    try {
        const respuesta = await fetch(`${URL_API}/${miId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!respuesta.ok) throw new Error("Error al cargar el perfil");

        const user = await respuesta.json();

        // 1. Llenar la cabecera visual
        const nombreCompleto = `${user.name} ${user.lastName || ''}`.trim();
        profileFullName.textContent = nombreCompleto;
        profileEmail.textContent = user.email;
        profileRole.textContent = user.role;
        avatarInitials.textContent = user.name.charAt(0).toUpperCase(); // Primera letra del nombre

        // 2. Llenar los inputs del formulario
        document.getElementById('name').value = user.name;
        document.getElementById('lastName').value = user.lastName || '';
        document.getElementById('email').value = user.email;

    } catch (error) {
        console.error(error);
        alert("Tu sesión es inválida. Vuelve a iniciar sesión.");
        cerrarSesion();
    }
}

profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.style.display = 'none';
    btnSaveProfile.disabled = true;
    btnSaveProfile.textContent = 'Guardando...';
    
    const formData = new FormData(profileForm);
    const datos = Object.fromEntries(formData);
    
    // Si la contraseña está vacía, no la enviamos al backend
    if (!datos.password) delete datos.password;

    try {
        const respuesta = await fetch(`${URL_API}/${miId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            formError.textContent = resultado.message || (resultado.errors ? resultado.errors[0].message : "Error al actualizar");
            formError.style.display = 'block';
            return;
        }

        alert("¡Perfil actualizado con éxito!");
        
        // Refrescamos la vista para que se actualicen los nombres arriba
        cargarMiPerfil(); 
        
        // Opcional: Limpiamos la caja de contraseña por seguridad
        document.getElementById('password').value = '';

    } catch (error) {
        formError.textContent = "Error de conexión con el servidor";
        formError.style.display = 'block';
    } finally {
        btnSaveProfile.disabled = false;
        btnSaveProfile.textContent = '💾 Guardar Cambios';
    }
});