// FOR FRONTEND 

import axios from 'axios';
import { showAlert } from './alert';

const stripe = Stripe('pk_test_51KfGl2Ap2JEIzkDBuhZQ8E78ttvRXSqZuZeXGowGbdcGf9MpxDvVoeqDamrxPCaSJkdrvc5jRcJLA3RNlsZpxupf00DW0Zy2qb');




const bookTour = async tourId=>{
    try{
        // 1) Get checkout session from API
        const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
        console.log(session);

        // 2) Create checkout form + charge credit card
        await stripe.redirectToCheckout({
            // the id is get from data attribute HTML in tour.pug at booking button
            sessionId: session.data.session.id
        });

    }catch(err){
        console.log(err);
        showAlert('error', err);
    }

    
}


export {bookTour};