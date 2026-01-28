
import { sendOrderConfirmation } from './api/services/email.js';

const dummyOrder = {
    id: 'TEST-12345',
    total: 55000,
    billing_info: {
        first_name: 'Test',
        email: 'delivered@resend.dev' // Resend allows specific test emails or the registered user's email
    },
    shipping_info: {
        first_name: 'Test',
        last_name: 'User',
        address_1: 'Calle 123 # 45-67',
        phone: '3001234567'
    },
    line_items: [
        { name: 'Aceite Esencial Lavanda', quantity: 1, unit_price: 25000 },
        { name: 'Kit Bienestar', quantity: 1, unit_price: 30000 }
    ]
};

const dummyTransaction = {
    id: 'WOMPI-REF-999'
};

console.log("Testing Email Service...");
// NOTE: Ideally, the user should change 'delivered@resend.dev' to THEIR email to actually see it.
// Resend 'delivered@resend.dev' is a magic address that always succeeds (simulated).

sendOrderConfirmation(dummyOrder, dummyTransaction);
