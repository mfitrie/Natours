import axios from 'axios';
import { showAlert } from './alert';



const login = async (email, password)=>{
    try{
        const res = await axios({
            method: 'POST',
            url: '/api/v1/users/login',
            data:{
                email,
                password
            }
        });

        if(res.data.status === 'success'){
            // alert('Logged in successfullt!');
            showAlert('success','Logged in successfully!');
            window.setTimeout(()=>{
                // move to homepage
                location.assign('/');
            }, 1500);
        }

    }catch(err){
        // alert(err.response.data.message);
        showAlert('error',err.response.data.message);

    }
    
}

// document.querySelector('.form').addEventListener('submit', e=>{
//     e.preventDefault();
//     const email = document.getElementById('email').value;
//     const password = document.getElementById('password').value;

//     login(email, password);
// });


const logout = async()=>{
    try{
        const res = await axios({
            method: 'GET',
            url: '/api/v1/users/logout'
        });

        if(res.data.status = 'success'){
            // force the reload from server, not from browser
            // location is from DOM
            location.reload(true);
        }
    }catch(err){
        showAlert('error', 'Error logging out! Try again.')
    }
}



export {login, logout}