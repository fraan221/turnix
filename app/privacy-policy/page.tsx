// app/privacy-policy/page.tsx

export default function PrivacyPolicyPage() {
  const cleanHtml = `
    <h1>POLÍTICA DE PRIVACIDAD</h1>
    <p><em>Última actualización: 08 de julio de 2025</em></p>
    <p>Este Aviso de Privacidad para <strong>Turnix</strong> ("nosotros", "nos" o "nuestro"), describe cómo y por qué podríamos acceder, recopilar, almacenar, usar y/o compartir ("procesar") tu información personal cuando utilizas nuestros servicios ("Servicios"), incluyendo cuando:</p>
    <ul>
      <li>Visitas nuestro sitio web en <a href="https://turnix.app" target="_blank" rel="noopener noreferrer">https://turnix.app</a> o cualquier sitio web nuestro que enlace a este Aviso de Privacidad.</li>
      <li>Usas Turnix. Es una plataforma web diseñada para ayudar a barberos y profesionales similares a gestionar su negocio. El servicio les permite administrar sus horarios de trabajo, lista de servicios, clientes y recibir reservas online a través de una página de perfil pública y personalizada.</li>
      <li>Interactúas con nosotros de otras maneras relacionadas, incluyendo ventas, marketing o eventos.</li>
    </ul>
    <p><strong>¿Preguntas o inquietudes?</strong> Leer este Aviso de Privacidad te ayudará a entender tus derechos y opciones de privacidad. Si no estás de acuerdo con nuestras políticas y prácticas, por favor no uses nuestros Servicios. Si aún tienes alguna pregunta o inquietud, por favor contáctanos en <strong>privacidad@turnix.app</strong>.</p>
    
    <h2>RESUMEN DE PUNTOS CLAVE</h2>
    <p><strong><em>Este resumen proporciona los puntos clave de nuestro Aviso de Privacidad, pero puedes encontrar más detalles sobre cualquiera de estos temas utilizando nuestra <a href="#toc">tabla de contenidos</a> a continuación para encontrar la sección que buscas.</em></strong></p>
    
    <h2 id="toc">TABLA DE CONTENIDOS</h2>
    <ol>
        <li><a href="#infocollect">¿QUÉ INFORMACIÓN RECOPILAMOS?</a></li>
        <li><a href="#infouse">¿CÓMO PROCESAMOS TU INFORMACIÓN?</a></li>
        <li><a href="#legalbases">¿EN QUÉ BASES LEGALES NOS APOYAMOS PARA PROCESAR TU INFORMACIÓN PERSONAL?</a></li>
        <li><a href="#whoshare">¿CUÁNDO Y CON QUIÉN COMPARTIMOS TU INFORMACIÓN PERSONAL?</a></li>
        <li><a href="#cookies">¿USAMOS COOKIES Y OTRAS TECNOLOGÍAS DE SEGUIMIENTO?</a></li>
        <li><a href="#sociallogins">¿CÓMO MANEJAMOS TUS INICIOS DE SESIÓN SOCIALES?</a></li>
        <li><a href="#intltransfers">¿SE TRANSFIERE TU INFORMACIÓN INTERNACIONALMENTE?</a></li>
        <li><a href="#inforetain">¿CUÁNTO TIEMPO CONSERVAMOS TU INFORMACIÓN?</a></li>
        <li><a href="#infosafe">¿CÓMO MANTENEMOS TU INFORMACIÓN SEGURA?</a></li>
        <li><a href="#infominors">¿RECOPILAMOS INFORMACIÓN DE MENORES?</a></li>
        <li><a href="#privacyrights">¿CUÁLES SON TUS DERECHOS DE PRIVACIDAD?</a></li>
        <li><a href="#DNT">CONTROLES PARA FUNCIONES "DO-NOT-TRACK"</a></li>
        <li><a href="#uslaws">¿LOS RESIDENTES DE ESTADOS UNIDOS TIENEN DERECHOS DE PRIVACIDAD ESPECÍFICOS?</a></li>
        <li><a href="#policyupdates">¿HACEMOS ACTUALIZACIONES A ESTE AVISO?</a></li>
        <li><a href="#contact">¿CÓMO PUEDES CONTACTARNOS SOBRE ESTE AVISO?</a></li>
        <li><a href="#request">¿CÓMO PUEDES REVISAR, ACTUALIZAR O ELIMINAR LOS DATOS QUE RECOPILAMOS DE TI?</a></li>
    </ol>

    <h2 id="infocollect">1. ¿QUÉ INFORMACIÓN RECOPILAMOS?</h2>
    <h3>Información personal que nos revelas</h3>
    <p><strong><em>En resumen:</em></strong><em> Recopilamos la información personal que tú nos proporcionas.</em></p>
    <p>Recopilamos información personal que voluntariamente nos proporcionas cuando te registras en los Servicios, expresas interés en obtener información sobre nosotros o nuestros productos y Servicios, cuando participas en actividades en los Servicios, o de otra manera cuando nos contactas.</p>
    <p><strong>Información Personal Proporcionada por Ti.</strong> La información personal que recopilamos depende del contexto de tus interacciones con nosotros y los Servicios, las elecciones que haces y los productos y características que utilizas. La información personal que recopilamos puede incluir lo siguiente: nombres, números de teléfono, direcciones de correo electrónico y contraseñas.</p>
    <p><strong>Información Sensible.</strong> Cuando es necesario, con tu consentimiento o según lo permita la ley aplicable, procesamos las siguientes categorías de información sensible: datos de salud.</p>
    <p><strong>Datos de Pago.</strong> Podemos recopilar los datos necesarios para procesar tu pago si decides realizar compras. Todos los datos de pago son manejados y almacenados por Mercado Pago y AstroPay. Puedes encontrar los enlaces a sus avisos de privacidad aquí: <a href="https://www.mercadopago.com.ar/privacidad" target="_blank" rel="noopener noreferrer">https://www.mercadopago.com.ar/privacidad</a> y <a href="https://www.astropay.com/es/politica-de-privacidad" target="_blank" rel="noopener noreferrer">https://www.astropay.com/es/politica-de-privacidad</a>.</p>
    <p><strong>Datos de Inicio de Sesión de Redes Sociales.</strong> Te ofrecemos la opción de registrarte utilizando los detalles de tu cuenta de redes sociales. Si eliges esta vía, recopilaremos la información de tu perfil como se describe en la sección <a href="#sociallogins">"¿CÓMO MANEJAMOS TUS INICIOS DE SESIÓN SOCIALES?"</a>.</p>
    <p>Toda la información personal que nos proporciones debe ser verdadera, completa y precisa, y debes notificarnos cualquier cambio.</p>

    <h3>Información recopilada automáticamente</h3>
    <p><strong><em>En resumen:</em></strong><em> Cierta información (como tu dirección IP y características de tu navegador/dispositivo) se recopila automáticamente cuando visitas nuestros Servicios.</em></p>
    <p>Recopilamos automáticamente cierta información cuando visitas, usas o navegas por los Servicios. Esta información no revela tu identidad específica pero puede incluir información de dispositivo y uso, como tu dirección IP, características del navegador y dispositivo, sistema operativo, preferencias de idioma, URLs de referencia, nombre del dispositivo, país, ubicación y otra información técnica. Esta información es necesaria principalmente para mantener la seguridad y el funcionamiento de nuestros Servicios, y para nuestros fines internos de análisis.</p>
    <p>Como muchas empresas, también recopilamos información a través de cookies y tecnologías similares. Puedes obtener más información en nuestro Aviso de Cookies: <a href="/cookie-policy" target="_blank" rel="noopener noreferrer">https://turnix.app/cookie-policy</a>.</p>
    
    <h2 id="infouse">2. ¿CÓMO PROCESAMOS TU INFORMACIÓN?</h2>
    <p><strong><em>En resumen:</em></strong><em> Procesamos tu información para proporcionar, mejorar y administrar nuestros Servicios, comunicarnos contigo, para seguridad y prevención de fraudes, y para cumplir con la ley.</em></p>
    <p>Procesamos tu información personal por diversas razones, dependiendo de cómo interactúes con nuestros Servicios, incluyendo:</p>
    <ul>
      <li><strong>Para facilitar la creación de cuentas y la autenticación.</strong></li>
      <li><strong>Para entregar y facilitar la prestación de servicios al usuario.</strong></li>
      <li><strong>Para responder a consultas de usuarios y ofrecer soporte.</strong></li>
      <li><strong>Para enviarte información administrativa.</strong></li>
      <li><strong>Para gestionar tus pedidos y pagos.</strong></li>
      <li><strong>Para solicitar tu opinión (feedback).</strong></li>
      <li><strong>Para proteger nuestros Servicios,</strong> incluyendo la monitorización de fraude.</li>
      <li><strong>Para identificar tendencias de uso</strong> y mejorar nuestros Servicios.</li>
      <li><strong>Para proteger el interés vital de un individuo,</strong> como prevenir daños.</li>
    </ul>

    <h2 id="legalbases">3. ¿EN QUÉ BASES LEGALES NOS APOYAMOS?</h2>
    <p><strong><em>En resumen:</em></strong><em> Solo procesamos tu información cuando es legalmente necesario, ya sea con tu consentimiento, para cumplir con leyes, para proveerte servicios, proteger tus derechos o satisfacer nuestros intereses comerciales legítimos.</em></p>
    
    <h2 id="whoshare">4. ¿CUÁNDO Y CON QUIÉN COMPARTIMOS TU INFORMACIÓN PERSONAL?</h2>
    <p><strong><em>En resumen:</em></strong><em> Podemos compartir información en situaciones específicas y/o con ciertos terceros.</em></p>
    <ul>
      <li><strong>Transferencias de Negocios.</strong> Podemos compartir o transferir tu información durante negociaciones de cualquier fusión, venta de activos de la compañía, financiación o adquisición de nuestro negocio.</li>
    </ul>

    <h2 id="cookies">5. ¿USAMOS COOKIES Y OTRAS TECNOLOGÍAS DE SEGUIMIENTO?</h2>
    <p><strong><em>En resumen:</em></strong><em> Podemos usar cookies y otras tecnologías para recopilar y almacenar tu información.</em></p>
    <p>Para información específica sobre cómo usamos estas tecnologías y cómo puedes rechazar ciertas cookies, por favor consulta nuestro Aviso de Cookies: <a href="/cookie-policy" target="_blank" rel="noopener noreferrer">https://turnix.app/cookie-policy</a>.</p>
    
    <h2 id="sociallogins">6. ¿CÓMO MANEJAMOS TUS INICIOS DE SESIÓN SOCIALES?</h2>
    <p><strong><em>En resumen:</em></strong><em> Si te registras usando una cuenta de red social, podemos acceder a cierta información sobre ti.</em></p>
    <p>Si eliges iniciar sesión con una cuenta de terceros (como Google), recibiremos información de tu perfil de ese proveedor. Usaremos esta información únicamente para los fines descritos en este aviso. No controlamos ni somos responsables de cómo tu proveedor de red social utiliza tu información.</p>

    <h2 id="intltransfers">7. ¿SE TRANSFIERE TU INFORMACIÓN INTERNACIONALMENTE?</h2>
    <p><strong><em>En resumen:</em></strong><em> Podemos transferir, almacenar y procesar tu información en países distintos al tuyo.</em></p>
    <p>Nuestros servidores están en Estados Unidos. Si accedes a nuestros Servicios desde fuera, tu información será transferida y procesada en nuestras instalaciones y las de terceros con quienes compartimos información, principalmente en EE. UU. Implementamos las Cláusulas Contractuales Tipo de la Comisión Europea para proteger tu información.</p>
    
    <h2 id="inforetain">8. ¿CUÁNTO TIEMPO CONSERVAMOS TU INFORMACIÓN?</h2>
    <p><strong><em>En resumen:</em></strong><em> Conservamos tu información el tiempo necesario para cumplir los fines de este aviso, a menos que la ley exija lo contrario.</em></p>
    <p>Solo conservaremos tu información personal mientras sea necesario para los fines establecidos aquí, principalmente mientras tengas una cuenta activa con nosotros.</p>

    <h2 id="infosafe">9. ¿CÓMO MANTENEMOS TU INFORMACIÓN SEGURA?</h2>
    <p><strong><em>En resumen:</em></strong><em> Buscamos proteger tu información personal mediante medidas de seguridad técnicas y organizativas.</em></p>
    <p>Hemos implementado medidas de seguridad apropiadas. Sin embargo, ninguna transmisión electrónica por Internet puede garantizarse como 100% segura. El uso de nuestros Servicios es bajo tu propio riesgo.</p>

    <h2 id="infominors">10. ¿RECOPILAMOS INFORMACIÓN DE MENORES?</h2>
    <p><strong><em>En resumen:</em></strong><em> No recopilamos intencionadamente datos de menores de 18 años.</em></p>
    <p>No recopilamos datos ni nos dirigimos a menores de 18 años. Al usar los Servicios, declaras ser mayor de 18 años o ser el tutor de un menor y consentir su uso.</p>

    <h2 id="privacyrights">11. ¿CUÁLES SON TUS DERECHOS DE PRIVACIDAD?</h2>
    <p><strong><em>En resumen:</em></strong><em> Dependiendo de tu ubicación, tienes derechos que te permiten un mayor acceso y control sobre tu información personal.</em></p>
    <p>En algunas regiones (como el EEE, RU, Suiza y Canadá), tienes derecho a solicitar acceso, rectificación o eliminación de tus datos, y a restringir u oponerte a su procesamiento. Para ejercer tus derechos, contáctanos como se indica en la sección 15.</p>

    <h2 id="DNT">12. CONTROLES PARA FUNCIONES "DO-NOT-TRACK"</h2>
    <p>La mayoría de los navegadores web incluyen una función "Do-Not-Track" (DNT). Actualmente no existe un estándar tecnológico uniforme para reconocer e implementar señales DNT. Como tal, no respondemos a las señales de navegador DNT.</p>

    <h2 id="uslaws">13. ¿LOS RESIDENTES DE ESTADOS UNIDOS TIENEN DERECHOS DE PRIVACIDAD ESPECÍFICOS?</h2>
    <p>Sí, si eres residente de ciertos estados de EE. UU. (como California, Colorado, etc.), tienes derechos específicos sobre tu información personal. Puedes solicitar conocer, corregir y eliminar tus datos. Para hacerlo, contáctanos. No hemos vendido ni compartido información personal de consumidores en los últimos 12 meses.</p>

    <h2 id="policyupdates">14. ¿HACEMOS ACTUALIZACIONES A ESTE AVISO?</h2>
    <p><strong><em>En resumen:</em></strong><em> Sí, actualizaremos este aviso según sea necesario para cumplir con las leyes pertinentes.</em></p>
    <p>Podemos actualizar este Aviso de Privacidad de vez en cuando. La versión actualizada se indicará con una fecha "Revisada" actualizada y entrará en vigor tan pronto como sea accesible.</p>

    <h2 id="contact">15. ¿CÓMO PUEDES CONTACTARNOS SOBRE ESTE AVISO?</h2>
    <p>Si tienes preguntas o comentarios, puedes enviarnos un correo a <strong>privacidad@turnix.app</strong> o por correo postal a:</p>
    <p>Turnix<br/>Argentina</p>
    
    <h2 id="request">16. ¿CÓMO PUEDES REVISAR, ACTUALIZAR O ELIMINAR LOS DATOS QUE RECOPILAMOS DE TI?</h2>
    <p>Según las leyes de tu país, puedes tener derecho a solicitar acceso, modificar o eliminar la información personal que recopilamos sobre ti. Para realizar una solicitud, por favor visita: <a href="/contact" target="_blank" rel="noopener noreferrer">https://turnix.app/contact</a>.</p>
  `;

  return (
    <main className="max-w-4xl px-6 py-12 mx-auto">
      <div 
        className="prose prose-lg max-w-none prose-a:text-blue-600 hover:prose-a:text-blue-500"
        dangerouslySetInnerHTML={{ __html: cleanHtml }} 
      />
    </main>
  );
}