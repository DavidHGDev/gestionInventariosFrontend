const formLogin = document.querySelector('#loginForm');
const errorMessage = document.querySelector('#errorMessage');
const btnLogin = document.querySelector('#btnLogin');

formLogin.addEventListener('submit', async(event) => {
    event.preventDefault(); //evita que el navegador recarga la página

    errorMessage.style.display = 'none';
    btnLogin.textContent = 'Cargando...';
    btnLogin.disabled = true;

    try {
        const formData = new FormData(formLogin); //extraemos los datos de un golpe.
        const datosDelFormulario = Object.fromEntries(formData); //convertimos a un json perfecto. 

        //Lo mágico, cruzamos el puente entre el fronted y el backend
        const respuesta = await fetch('http://localhost:3007/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' //explicamos al backend que le mandamos un json como tipo de dato
            }, 
            body: JSON.stringify(datosDelFormulario)
        })

        const result = await respuesta.json();

        //Evaluar la respuesta si tiene error y mostrarlo en pantalla
        if(!respuesta.ok){
            errorMessage.textContent = result.message || result.errors[0].message;
            errorMessage.style.display = 'block'; 
            return; //detenemos la ejecución.
        }

        // si ingresamos sin problema
        console.log('login exitoso, backend nos dejó entrar', result);

        sessionStorage.setItem('token', result.token); // guardamos el token para utilizarlo luego
        window.location.href = '/dashboard.html' // re-dirigimos a la página principal 

    } catch (error) {
        console.log('Error crítico de red', error); // por lo general, server apagado
        errorMessage.textContent = 'Error de conexión con el servidor';
        errorMessage.style.display = 'block'
    } finally {
        //sea un error o éxito en la petición, devolvemos el botón a la normalidad
        btnLogin.textContent = 'Ingresar';
        btnLogin.disabled = false;
    }

})