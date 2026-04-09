// js/clients.js
import { verificarAutenticacion, cerrarSesion } from './utils/auth.js';

// 1. EL GUARDIA (Importado, limpio y reutilizable)
const token = verificarAutenticacion();
const URL_API = 'http://localhost:3007/api/clients'; // Ajusta la ruta si es diferente en tu backend

// 2. ELEMENTOS DEL DOM
const clientsTableBody = document.getElementById('clientsTableBody');
const modal = document.getElementById('clientModal');
const clientForm = document.getElementById('clientForm');
const modalTitle = document.getElementById('modalTitle');
const formError = document.getElementById('formError');

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    cargarClientes();
    
    // Controles del Menú
    document.getElementById('btnOpenMenu').addEventListener('click', () => document.getElementById('sidebar').classList.add('active'));
    document.getElementById('btnCloseMenu').addEventListener('click', () => document.getElementById('sidebar').classList.remove('active'));
    document.getElementById('btnLogout').addEventListener('click', cerrarSesion);
});

// ==========================================
// R: READ (LEER CLIENTES)
// ==========================================
async function cargarClientes() {
    try {
        const respuesta = await fetch(URL_API, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!respuesta.ok) throw new Error("No autorizado");

        const clientes = await respuesta.json();
        dibujarTabla(clientes);
    } catch (error) {
        alert("Sesión expirada o error de red.");
        cerrarSesion();
    }
}

function dibujarTabla(clientes) {
    clientsTableBody.innerHTML = ''; 
    
    if(clientes.length === 0) {
        clientsTableBody.innerHTML = `<tr><td colspan="6" class="text-center">No hay clientes registrados</td></tr>`;
        return;
    }

    clientes.forEach(cliente => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>#${cliente.id}</td>
            <td><strong>${cliente.name}</strong></td>
            <td>${cliente.email || '<span class="text-muted">N/A</span>'}</td>
            <td>${cliente.phone || '<span class="text-muted">N/A</span>'}</td>
            <td>${cliente.address || '<span class="text-muted">N/A</span>'}</td>
            <td>
                <button class="action-btn btn-edit" onclick="abrirModalEdicion(${cliente.id})" title="Editar">✏️</button>
                <button class="action-btn btn-delete" onclick="eliminarCliente(${cliente.id})" title="Eliminar">🗑️</button>
            </td>
        `;
        clientsTableBody.appendChild(fila);
    });
}

// ==========================================
// C & U: CREATE Y UPDATE
// ==========================================
document.getElementById('btnNewClient').addEventListener('click', () => {
    clientForm.reset();
    document.getElementById('clientId').value = ''; 
    modalTitle.textContent = 'Nuevo Cliente';
    formError.style.display = 'none';
    modal.classList.add('active');
});

// Adjuntamos a window porque en módulos de JS las funciones son privadas por defecto
window.abrirModalEdicion = async (id) => {
    try {
        const respuesta = await fetch(`${URL_API}/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const cliente = await respuesta.json();

        document.getElementById('clientId').value = cliente.id;
        document.getElementById('name').value = cliente.name;
        document.getElementById('email').value = cliente.email || '';
        document.getElementById('phone').value = cliente.phone || '';
        document.getElementById('address').value = cliente.address || '';
        
        modalTitle.textContent = 'Editar Cliente';
        formError.style.display = 'none';
        modal.classList.add('active');
    } catch (error) {
        alert("Error al obtener los datos del cliente");
    }
};

const cerrarModal = () => modal.classList.remove('active');
document.getElementById('btnCloseModal').addEventListener('click', cerrarModal);
document.getElementById('btnCancel').addEventListener('click', cerrarModal);

clientForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.style.display = 'none';
    
    const formData = new FormData(clientForm);
    const datos = Object.fromEntries(formData);
    const idCliente = datos.id; 

    const metodoHTTP = idCliente ? 'PATCH' : 'POST';
    const urlFinal = idCliente ? `${URL_API}/${idCliente}` : URL_API;

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
            formError.textContent = resultado.message || (resultado.errors ? resultado.errors[0].message : "Error al guardar");
            formError.style.display = 'block';
            return;
        }

        cerrarModal();
        cargarClientes(); 
        alert(`Cliente ${idCliente ? 'actualizado' : 'creado'} exitosamente.`);

    } catch (error) {
        formError.textContent = "Error de conexión con el servidor";
        formError.style.display = 'block';
    }
});

// ==========================================
// D: DELETE
// ==========================================
window.eliminarCliente = async (id) => {
    if (!confirm("¿Eliminar definitivamente a este cliente? Esta acción no se puede deshacer.")) return;

    try {
        const respuesta = await fetch(`${URL_API}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (respuesta.ok) cargarClientes();
        else {
            const errorData = await respuesta.json();
            alert(errorData.message || "Error al eliminar el cliente.");
        }
    } catch (error) {
        alert("Error de conexión");
    }
};