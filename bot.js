const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth()
});

// 🟡 usuarios haciendo pedido
let clientesPedido = new Map();

// 🔴 usuarios en modo humano (con tiempo)
let clientesAtendidos = new Map();

// ⏱️ tiempo de bloqueo (1 hora)
const TIEMPO_BLOQUEO = 60 * 60 * 1000;

// QR
client.on('qr', qr => {
    console.log('Escanea este QR 👇');
    qrcode.generate(qr, { small: true });
});

// BOT LISTO
client.on('ready', () => {
    console.log('Bot listo 🚀');
});

// ERRORES
client.on('auth_failure', msg => {
    console.error('Error de autenticación:', msg);
});

client.on('disconnected', reason => {
    console.log('Bot desconectado:', reason);
});

client.on('message', async message => {
    try {
        const texto = message.body.trim().toLowerCase();
        const usuario = message.from;
        const ahora = Date.now();

        // 🔴 SI ESTÁ EN MODO HUMANO
        if (clientesAtendidos.has(usuario)) {
            const tiempoGuardado = clientesAtendidos.get(usuario);

            if (ahora - tiempoGuardado < TIEMPO_BLOQUEO) {
                return; // bot apagado
            } else {
                clientesAtendidos.delete(usuario); // reactivar bot
            }
        }

        // 🟡 SI ESTÁ HACIENDO PEDIDO
        if (clientesPedido.has(usuario)) {
            const pedido = message.body;

            console.log(`🧾 Pedido de ${usuario}: ${pedido}`);

            await message.reply(`✅ Pedido recibido:

"${pedido}"

En breve te confirmamos 🍔`);

            clientesPedido.delete(usuario);

            // 🔥 activar modo humano
            clientesAtendidos.set(usuario, ahora);

            return;
        }

        // 🟢 MENÚ
        if (texto.includes('hola') || texto.includes('menu')) {
            await message.reply(`🍔 ¡Gracias por comunicarte con Maravilla's Burguer!

¿En qué podemos servirte?

1️⃣ Menú
2️⃣ Ubicación 📍
3️⃣ Hacer pedido
4️⃣ Ayuda / Hablar con alguien`);
        }

        // 🖼️ MENÚ CON IMÁGENES
        else if (texto === '1') {
            try {
                const menu1 = MessageMedia.fromFilePath('./imagenes/m1.jpeg');
                const menu2 = MessageMedia.fromFilePath('./imagenes/m2.jpeg');
                const menu3 = MessageMedia.fromFilePath('./imagenes/m3.jpeg');

                await message.reply('🍔 Aquí está nuestro menú 👇');
                await client.sendMessage(usuario, menu1);
                await client.sendMessage(usuario, menu2);
                await client.sendMessage(usuario, menu3);
            } catch (error) {
                console.log("Error imágenes:", error);
                await message.reply('⚠️ Error cargando menú');
            }
        }

        // 📍 UBICACIÓN
        else if (texto === '2') {
            await message.reply(`📍 Estamos ubicados en:

https://maps.app.goo.gl/56CtDFmwSUEE7vfv5

Abrimos de 6pm a 11pm 🍔`);
        }

        // 📝 ACTIVAR PEDIDO
        else if (texto === '3') {
            clientesPedido.set(usuario, true);

            await message.reply(`📝 Escribe tu pedido completo:

Ejemplo:
2 hamburguesas dobles y 1 orden de papas 🍟`);
        }

        // 🙋‍♂️ MODO HUMANO MANUAL
        else if (texto === '4' || texto.includes('ayuda')) {
            await message.reply(`🙋‍♂️ En un momento te atiende una persona.

Gracias por tu paciencia 🍔`);

            clientesAtendidos.set(usuario, ahora);
        }

        // 🤖 NO ENTENDIÓ
        else {
            await message.reply(`🤖 No entendí tu mensaje.

Escribe:
1️⃣ Menú
2️⃣ Ubicación
3️⃣ Pedido
4️⃣ Ayuda`);
        }

    } catch (error) {
        console.log("Error general:", error);
    }
});

client.initialize();