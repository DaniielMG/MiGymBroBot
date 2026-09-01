const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const http = require('http');

require('dotenv').config();

// Servidor HTTP para Render Web Service (Plan Gratuito $0/mes)
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('🦾 GymBroBot está activo y funcionando 24/7');
}).listen(PORT, () => {
    console.log(`🌐 Servidor de salud activo en el puerto ${PORT}`);
});

// TOKEN OFICIAL DEL BOT
const token = process.env.TELEGRAM_TOKEN;

if (!token) {
    console.error("❌ ERROR: TELEGRAM_TOKEN no está definido en las variables de entorno o archivo .env");
    console.error("Por favor, crea un archivo .env con TELEGRAM_TOKEN=tu_token o configúralo en el servidor.");
    process.exit(1);
}

// Persistencia de datos
const DATA_FILE = path.join(__dirname, 'users_db.json');
let users = {};

// Cargar base de datos al arrancar
try {
    if (fs.existsSync(DATA_FILE)) {
        users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
} catch (e) {
    console.error("Error cargando DB:", e);
}

function saveDB() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

// ─────────────────────────────────────────────
// BASE DE DATOS DE MÚSCULOS Y SUS VARIANTES
// ─────────────────────────────────────────────
const MUSCLE_DB = {
    'pecho': ['pecho', 'pectoral', 'tetas'],
    'espalda': ['espalda', 'dorsal', 'lumbares'],
    'pierna': ['pierna', 'cuadriceps', 'isquios', 'femoral', 'gluteo', 'pata'],
    'brazo': ['brazo', 'bicep', 'tricep', 'antebrazo', 'muñeca'],
    'hombro': ['hombro', 'deltoides', 'trapecio'],
    'abdominales': ['abdominales', 'abdomen', 'abs', 'core', 'tripa'],
    'cardio': ['cardio', 'correr', 'bici', 'hiit', 'quemar', 'cinta', 'eliptica']
};

// ─────────────────────────────────────────────
// BANCO COMPLETO DE EJERCICIOS (10 por músculo)
// Formato: { nombre, series, reps }
// ─────────────────────────────────────────────
const EXERCISE_BANK = {
    pecho: [
        { nombre: 'Press Banca', series: 4, reps: '10' },
        { nombre: 'Press Banca Inclinado', series: 4, reps: '10' },
        { nombre: 'Press Banca Declinado', series: 3, reps: '12' },
        { nombre: 'Aperturas con mancuernas', series: 3, reps: '12' },
        { nombre: 'Aperturas en polea cruzada', series: 3, reps: '15' },
        { nombre: 'Flexiones', series: 3, reps: 'al fallo' },
        { nombre: 'Flexiones con pies elevados', series: 3, reps: 'al fallo' },
        { nombre: 'Press con mancuernas', series: 4, reps: '10' },
        { nombre: 'Pull-over con mancuerna', series: 3, reps: '12' },
        { nombre: 'Dips en paralelas', series: 3, reps: 'al fallo' },
    ],
    espalda: [
        { nombre: 'Dominadas', series: 4, reps: 'al fallo' },
        { nombre: 'Jalón al pecho', series: 4, reps: '10' },
        { nombre: 'Remo con barra', series: 4, reps: '10' },
        { nombre: 'Remo con mancuerna', series: 3, reps: '12' },
        { nombre: 'Peso muerto', series: 4, reps: '8' },
        { nombre: 'Remo en polea baja', series: 3, reps: '12' },
        { nombre: 'Remo en máquina', series: 3, reps: '12' },
        { nombre: 'Pull-over en polea', series: 3, reps: '15' },
        { nombre: 'Hiperextensiones lumbares', series: 3, reps: '15' },
        { nombre: 'Rack Pull', series: 4, reps: '8' },
    ],
    pierna: [
        { nombre: 'Sentadillas', series: 4, reps: '8' },
        { nombre: 'Sentadilla frontal', series: 4, reps: '8' },
        { nombre: 'Prensa de pierna', series: 4, reps: '12' },
        { nombre: 'Zancadas con peso', series: 3, reps: '12' },
        { nombre: 'Curl femoral tumbado', series: 3, reps: '12' },
        { nombre: 'Extensiones de cuádriceps', series: 3, reps: '15' },
        { nombre: 'Hip thrust', series: 4, reps: '10' },
        { nombre: 'Peso muerto rumano', series: 4, reps: '10' },
        { nombre: 'Elevaciones de gemelo', series: 4, reps: '20' },
        { nombre: 'Step-up con mancuernas', series: 3, reps: '12' },
    ],
    brazo: [
        { nombre: 'Curl de bíceps con barra', series: 3, reps: '12' },
        { nombre: 'Curl de bíceps con mancuernas', series: 3, reps: '12' },
        { nombre: 'Curl martillo', series: 3, reps: '12' },
        { nombre: 'Curl concentrado', series: 3, reps: '12' },
        { nombre: 'Curl en polea baja', series: 3, reps: '15' },
        { nombre: 'Extensiones de tríceps en polea', series: 3, reps: '15' },
        { nombre: 'Press francés', series: 3, reps: '12' },
        { nombre: 'Fondos en banco', series: 3, reps: 'al fallo' },
        { nombre: 'Patada de tríceps', series: 3, reps: '15' },
        { nombre: 'Curl de muñeca', series: 3, reps: '20' },
    ],
    hombro: [
        { nombre: 'Press militar con barra', series: 4, reps: '10' },
        { nombre: 'Press con mancuernas sentado', series: 4, reps: '10' },
        { nombre: 'Elevaciones laterales', series: 4, reps: '15' },
        { nombre: 'Elevaciones frontales', series: 3, reps: '12' },
        { nombre: 'Pájaro (rear delt fly)', series: 3, reps: '15' },
        { nombre: 'Face pull en polea', series: 3, reps: '15' },
        { nombre: 'Arnold press', series: 3, reps: '12' },
        { nombre: 'Encogimientos de trapecio', series: 4, reps: '15' },
        { nombre: 'Remo al cuello', series: 3, reps: '12' },
        { nombre: 'Rotaciones externas en polea', series: 3, reps: '15' },
    ],
    abdominales: [
        { nombre: 'Crunch abdominal', series: 4, reps: '20' },
        { nombre: 'Plancha frontal', series: 3, reps: '60s' },
        { nombre: 'Plancha lateral', series: 3, reps: '45s' },
        { nombre: 'Elevaciones de piernas', series: 3, reps: '15' },
        { nombre: 'Rueda abdominal', series: 3, reps: '10' },
        { nombre: 'Mountain climbers', series: 3, reps: '30s' },
        { nombre: 'Tijeras', series: 3, reps: '20' },
        { nombre: 'Bicicleta abdominal', series: 3, reps: '20' },
        { nombre: 'Crunch en polea', series: 3, reps: '15' },
        { nombre: 'Vacuum abdominal', series: 3, reps: '30s' },
    ],
    cardio: [
        { nombre: 'HIIT en cinta', series: 1, reps: '10 rondas (30s sprint / 30s descanso)' },
        { nombre: 'Elíptica ritmo constante', series: 1, reps: '20 min' },
        { nombre: 'Burpees', series: 4, reps: '10' },
        { nombre: 'Saltos a la comba', series: 3, reps: '2 min' },
        { nombre: 'Bicicleta estática', series: 1, reps: '20 min ritmo moderado' },
        { nombre: 'Carrera continua', series: 1, reps: '25 min' },
        { nombre: 'Jumping jacks', series: 4, reps: '30' },
        { nombre: 'Remo en máquina', series: 1, reps: '15 min' },
        { nombre: 'Sprints en cinta', series: 6, reps: '200m máximo esfuerzo' },
        { nombre: 'Box jumps', series: 4, reps: '10' },
    ],
};

// ─────────────────────────────────────────────
// EXPLICACIONES DETALLADAS DE TODOS LOS EJERCICIOS
// ─────────────────────────────────────────────
const EXPLANATIONS = {
    // PECHO
    'press banca': '🏋️ Túmbate en el banco con los pies pegados al suelo. Agarra la barra algo más ancha que los hombros, bájala de forma controlada hasta rozar el pecho y empuja hacia arriba explosivamente. Escápulas juntas y pecho fuera en todo momento.',
    'press banca inclinado': '📐 Igual que el press banca pero con el banco a 30-45°. Trabaja la parte alta del pectoral. Controla la bajada en 2-3 segundos y empuja fuerte.',
    'press banca declinado': '📉 Banco a -15-30°. Trabaja la parte baja del pectoral. Cuidado con el equilibrio al sacar la barra del rack.',
    'aperturas con mancuernas': '🦅 Túmbate en banco plano, mancuernas arriba. Abre los brazos en arco manteniendo una ligera flexión de codo, baja hasta sentir el estiramiento en el pecho y vuelve apretando los pectorales. NO es un ejercicio de fuerza, úsalo con peso moderado.',
    'aperturas en polea cruzada': '⚡ De pie entre las poleas altas, agarra las empuñaduras y cruza los brazos hacia el centro y abajo como si abrazaras un árbol. Pon foco total en el pectoral.',
    'flexiones': '💪 Manos algo más anchas que los hombros, cuerpo recto como una tabla desde cabeza hasta talones. Baja el pecho al suelo y sube. Si es difícil al principio, apoya las rodillas. Para más dificultad, eleva los pies.',
    'flexiones con pies elevados': '⬆️ Igual que las flexiones normales pero con los pies sobre un banco o silla. Esto enfatiza la parte alta del pectoral y los deltoides anteriores.',
    'press con mancuernas': '🏋️ Como el press banca pero con mancuernas. Ventaja: mayor rango de movimiento y trabaja la estabilización. Baja hasta que los codos queden por debajo del banco.',
    'pull-over con mancuerna': '🔄 Túmbate transversalmente en un banco, coge una mancuerna con ambas manos sobre el pecho. Bájala por detrás de la cabeza manteniendo los codos ligeramente flexionados. Vuelve arriba. Trabaja pectoral y serrato.',
    'dips en paralelas': '⬇️ Agárrate a las paralelas, inclínate ligeramente hacia adelante para trabajar más el pecho (recto = tríceps). Baja hasta que los hombros estén a la altura de los codos y empuja hacia arriba.',

    // ESPALDA
    'dominadas': '🦍 Agarra la barra con las manos algo más anchas que los hombros (prono = palmas afuera). Cuelga completamente y sube hasta que la barbilla pase la barra. Baja de forma controlada. Sin tirones ni impulsos con la cadera.',
    'jalon al pecho': '⬇️ Sentado en la máquina de jalón, agarra la barra ancha, inclínate ligeramente atrás y tira de la barra hacia la parte alta del pecho apretando los dorsales. No uses el peso corporal para tirar.',
    'remo con barra': '🚣 Con la barra en el suelo, flexiona las caderas hasta que el torso quede casi horizontal, rodillas ligeramente flexionadas. Tira de la barra hacia el abdomen apretando los codos pegados al cuerpo. Espalda siempre neutra.',
    'remo con mancuerna': '💪 Apoya una rodilla y la mano del mismo lado en un banco. Con la otra mano coge la mancuerna y tírala hacia la cadera, codo al cielo. Controla la bajada. Excelente para el grosor dorsal.',
    'peso muerto': '⚠️ El rey de los ejercicios. Barra en el suelo a la altura de las espinillas. Espalda neutra, pecho fuera, caderas abajo. Empuja el suelo con los pies mientras subes la barra pegada a las piernas. Abajo: caderas y rodillas se doblan a la vez. ¡Jamás redondees la espalda!',
    'remo en polea baja': '🎣 Sentado en la máquina, pies en los apoyos, tira del agarre hacia el abdomen manteniendo la espalda erecta. Saca pecho al final del movimiento y controla la vuelta.',
    'remo en maquina': '🖥️ Fácil de ejecutar correctamente. Regula el asiento para que los codos queden a la altura del hombro. Tira del agarre hacia ti, aprieta la espalda al final y vuelve lento.',
    'pull-over en polea': '🔁 De pie de espaldas a la polea alta, coge la cuerda o barra y, con los brazos casi rectos, bájalos en arco hasta las caderas. Siente el dorsal trabajar al máximo. Excelente para conectar mentalmente con el dorsal.',
    'hiperextensiones lumbares': '🔙 En el banco de hiperextensión, cruza los brazos o coge un peso en el pecho. Baja el torso y súbelo hasta quedar recto (no hiperextiendas). Fortalece lumbares y glúteos.',
    'rack pull': '🏗️ Como el peso muerto pero la barra parte de los pines del rack a la altura de las rodillas. Permite manejar más peso y enfatiza la parte alta del tirón. Ideal para ganar fuerza en la espalda alta.',

    // PIERNA
    'sentadillas': '👑 La reina del tren inferior. Barra en la espalda alta (o baja), pies a la anchura de hombros, punta de pies ligeramente hacia afuera. Baja como si te sentaras en una silla invisible, rodillas siguen la línea de los pies. Muslo paralelo al suelo mínimo. Sube empujando el suelo.',
    'sentadilla frontal': '🏋️ La barra va por delante, en los hombros. Requiere buena movilidad de muñecas y tobillos. Torso más vertical que en la sentadilla normal. Trabaja más el cuádriceps.',
    'prensa de pierna': '🦵 Regula el asiento para que las rodillas formen 90° al bajar. Pies a la anchura de hombros (arriba = más glúteo, abajo = más cuádriceps). Nunca bloquees las rodillas en la extensión completa.',
    'zancadas con peso': '🚶 Da un paso largo al frente y baja la rodilla trasera casi al suelo. La rodilla delantera no pasa la punta del pie. Puedes hacerlas estáticas, caminando o en reversa. Con mancuernas o barra.',
    'curl femoral tumbado': '🦿 Tumbado boca abajo en la máquina, curla los talones hacia los glúteos. Controla la bajada. No levantes las caderas al subir. Trabaja isquiotibiales.',
    'extensiones de cuadriceps': '🦵 Sentado en la máquina, extiende las piernas hasta quedar rectas. Baja lento para mayor tensión. Aísla el cuádriceps. Ideal como calentamiento o finalizador.',
    'hip thrust': '🍑 Apoya la espalda en un banco a la altura de los omóplatos, barra sobre las caderas (con pad). Pies planos en el suelo. Sube la cadera hasta que el torso quede horizontal. Aprieta el glúteo arriba. El ejercicio #1 para glúteos.',
    'peso muerto rumano': '🏗️ Como el peso muerto convencional pero las piernas casi rectas (ligera flexión de rodilla). Empuja las caderas atrás bajando la barra pegada a las piernas hasta sentir el estiramiento en los isquios. Espalda siempre neutra.',
    'elevaciones de gemelo': '🦶 De pie en el borde de un escalón (o en la máquina), sube de puntillas tanto como puedas y baja hasta sentir el estiramiento. Pausada al final. Puedes hacerla con una sola pierna para más dificultad.',
    'step-up con mancuernas': '📦 Coloca un pie en un banco o cajón, sube empujando con el talón del pie elevado. Baja controlado. Trabaja cuádriceps y glúteos de forma unilateral. Evita impulsarte con la pierna del suelo.',

    // BRAZO
    'curl de biceps con barra': '💪 De pie, barra con agarre supino (palmas arriba) a la anchura de hombros. Dobla los codos hacia arriba sin mover los hombros hacia delante. Baja lento. No te balancees.',
    'curl de biceps con mancuernas': '💪 Igual que con barra pero puedes girar la muñeca (supinación) al subir para mayor contracción. Alterna brazos o simultáneo.',
    'curl martillo': '🔨 Mancuernas con agarre neutro (pulgar arriba). Sube los brazos como con el curl normal. Trabaja bíceps braquial y braquiorradial (el músculo que da grosor al brazo).',
    'curl concentrado': '🎯 Sentado, codo apoyado en la cara interna del muslo. Sube la mancuerna de forma aislada. Máxima conexión mente-músculo. Al final del movimiento supina la muñeca.',
    'curl en polea baja': '🔗 De pie frente a la polea baja, agarra el cable y realiza el curl. La tensión constante del cable trabaja el músculo de forma diferente a las mancuernas.',
    'extensiones de triceps en polea': '⬇️ De pie frente a la polea alta, agarra la cuerda o barra. Codos pegados a los costados, extiende los brazos hacia abajo sin mover los codos. Aprieta el tríceps abajo.',
    'press frances': '💀 Tumbado en banco, mancuernas o barra EZ sobre el pecho. Dobla los codos bajando el peso hacia la frente (o detrás de la cabeza). Codos quietos, solo se mueven los antebrazos. Lleva el nombre bien ganado si te cae encima.',
    'fondos en banco': '🪑 Manos en el borde de un banco, pies extendidos hacia adelante. Baja el cuerpo flexionando los codos hasta 90° y sube. Para más dificultad, eleva los pies en otro banco.',
    'patada de triceps': '🦵 Inclinado hacia adelante (apoyo en banco), codo a 90°. Extiende el antebrazo hacia atrás hasta quedar el brazo recto. Pausa arriba. Baja lento. Aísla la cabeza lateral del tríceps.',
    'curl de muñeca': '🤲 Sentado, antebrazo apoyado en el muslo, palma hacia arriba. Sube y baja la mancuerna solo con la muñeca. Trabaja flexores del antebrazo. También al revés (palma abajo) para los extensores.',

    // HOMBRO
    'press militar con barra': '🏋️ De pie o sentado, barra a la altura del pecho (agarre algo más ancho que hombros). Empuja la barra hacia arriba hasta extender los brazos. Baja controlado. Core activado todo el rato para proteger la lumbar.',
    'press con mancuernas sentado': '🪑 Sentado en banco con respaldo, mancuernas a la altura de los hombros. Empuja hacia arriba y une ligeramente las mancuernas arriba. Baja hasta que los codos queden justo por debajo de los hombros.',
    'elevaciones laterales': '⬅️➡️ De pie, mancuernas a los costados. Sube los brazos lateralmente hasta la altura del hombro (no más). Codo ligeramente flexionado. Baja lento en 3-4 segundos. NO te balancees. Trabaja el deltoides lateral, el que da amplitud.',
    'elevaciones frontales': '⬆️ De pie, mancuernas delante del cuerpo. Sube un brazo (o ambos) hacia adelante hasta la altura del hombro. Baja controlado. Trabaja deltoides anterior.',
    'pajaro': '🐦 Inclinado hacia adelante (torso casi horizontal), mancuernas colgando. Abre los brazos lateralmente como un pájaro. Trabaja el deltoides posterior, muy importante para la salud del hombro.',
    'face pull en polea': '😎 Polea alta con cuerda. Tira hacia la cara separando las manos al final del movimiento (codos altos). Excelente para deltoides posterior y manguito rotador. Hazlo SIEMPRE.',
    'arnold press': '🔄 Mancuernas a la altura del pecho con palmas hacia ti. Al subir, rota las palmas hacia afuera. Baja invirtiendo el movimiento. Nombrado por el mismísimo Arnold. Trabaja todos los haces del deltoides.',
    'encogimientos de trapecio': '⬆️ De pie, mancuernas o barra colgando. Sube los hombros hacia las orejas sin doblar los codos. Mantén 1 segundo arriba y baja lento. Trabaja el trapecio superior.',
    'remo al cuello': '🏋️ Barra con agarre estrecho (o polea). Tira hacia el mentón manteniendo los codos por encima de las manos. Trabaja deltoides y trapecio. No lo subas demasiado para no lesionar el hombro.',
    'rotaciones externas en polea': '🔄 Codo pegado al costado, polea a la altura del abdomen. Rota el antebrazo hacia afuera. Fundamental para la salud del manguito rotador. Hazlo como calentamiento.',

    // ABDOMINALES
    'crunch abdominal': '🔼 Tumbado boca arriba, rodillas flexionadas. Sube el torso despegando solo los hombros del suelo, sin tirar del cuello. Aprieta el abdomen arriba y baja lento. No uses inercia.',
    'plancha frontal': '⏱️ Apoyado en antebrazos y puntillas, cuerpo completamente recto. Activa el abdomen, los glúteos y las piernas. No dejes caer las caderas ni las subas. Respira de forma constante.',
    'plancha lateral': '↔️ Apoyado en un antebrazo y el lateral del pie. Cuerpo recto de cabeza a talones. Para más dificultad, levanta el brazo libre hacia el techo o eleva la pierna.',
    'elevaciones de piernas': '🦵 Tumbado boca arriba (o colgado de la barra). Sube las piernas rectas hasta 90° y baja lento sin apoyarlas del todo. Trabaja abdominales inferiores y flexores de cadera.',
    'rueda abdominal': '☸️ De rodillas, coge la rueda abdominal con ambas manos. Extiende los brazos hacia adelante bajando el torso casi al suelo y vuelve usando el core. Uno de los ejercicios más efectivos. Empieza con rango corto.',
    'mountain climbers': '⛰️ En posición de plancha, lleva alternamente las rodillas hacia el pecho de forma rápida. Mantén las caderas bajas. Trabaja core y cardio al mismo tiempo.',
    'tijeras': '✂️ Tumbado boca arriba, manos bajo los glúteos. Sube y baja las piernas alternadamente (como unas tijeras) sin tocar el suelo. Mantén la zona lumbar pegada al suelo.',
    'bicicleta abdominal': '🚴 Tumbado, manos en la cabeza. Lleva el codo derecho a la rodilla izquierda mientras extiendes la derecha, y viceversa. Movimiento controlado. El mejor ejercicio para los oblicuos según estudios EMG.',
    'crunch en polea': '🔗 De rodillas frente a la polea alta, coge la cuerda detrás de la nuca. Dobla el torso hacia abajo contrayendo el abdomen. El peso añadido lo hace más desafiante que el crunch normal.',
    'vacuum abdominal': '🫁 Vacía el aire de los pulmones y mete el ombligo hacia la columna tanto como puedas. Mantén. Trabaja el transverso del abdomen (la faja natural). Perfecto para aplanar la barriga.',

    // CARDIO
    'hiit en cinta': '💀 30 segundos de sprint al máximo (9-12 km/h o más) y 30 segundos caminando. Repite 10 rondas. Quema grasa incluso después de terminar (efecto EPOC). No te agarres a los laterales.',
    'eliptica ritmo constante': '🔄 Mantén un ritmo moderado donde puedas hablar pero con algo de esfuerzo. Activa brazos y piernas. Ideal para cardio sin impacto en las articulaciones.',
    'burpees': '💥 De pie, baja las manos al suelo, salta los pies hacia atrás (posición de flexión), haz una flexión (opcional), salta los pies hacia las manos y salta hacia arriba con los brazos al aire. El ejercicio de cuerpo completo definitivo.',
    'saltos a la comba': '🪢 Mantén un ritmo constante. Empezaa con 30s de trabajo y 30s de descanso. Mejora la coordinación, el cardio y la agilidad. Usa las muñecas para girar la cuerda, no los brazos.',
    'bicicleta estatica': '🚴 Ajusta el sillín para que la rodilla quede ligeramente flexionada abajo. Pedalea a un ritmo moderado-alto. Puedes hacer intervalos: 1 min fuerte, 1 min suave.',
    'carrera continua': '🏃 Encuentra un ritmo cómodo donde puedas mantener una conversación. Aterriza con el mediopié, no el talón. 25-30 minutos a ritmo constante es perfectamente válido.',
    'jumping jacks': '⭐ Salta abriendo y cerrando piernas y brazos simultáneamente. Buen calentamiento cardiovascular. Mantén las rodillas ligeramente flexionadas al aterrizar.',
    'remo en maquina': '🚣 Empuja con los pies primero, luego inclina el torso hacia atrás y tira del manillar hacia el pecho. Al revés para volver. Mantén la espalda erguida. 20 minutos a ritmo constante son brutales.',
    'sprints en cinta': '💨 Calentamiento de 3 minutos. Luego, 200m al máximo esfuerzo posible, descansa hasta recuperarte y repite. 6 series son suficientes. Desarrolla potencia y quema grasa de forma muy efectiva.',
    'box jumps': '📦 Frente a un cajón o banco estable. Flexiona ligeramente las rodillas y salta aterrizando con ambos pies sobre el cajón. Baja de forma controlada (o salta hacia atrás). Desarrolla potencia explosiva.',
};

// ─────────────────────────────────────────────
// LÓGICA DE RECOMENDACIONES INTELIGENTE
// ─────────────────────────────────────────────
function getRecommendations(goal, workoutArray) {
    const total = workoutArray.length;
    const exercisesPerMuscle = total === 1 ? 5 : total === 2 ? 4 : 3;

    let res = "";

    workoutArray.forEach(part => {
        const p = part.toLowerCase();
        const pool = EXERCISE_BANK[p] || [];

        // Mezcla aleatoria para variedad en cada sesión
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, exercisesPerMuscle);

        res += `\n🔸 *${part.toUpperCase()}*:\n`;
        selected.forEach(ex => {
            const repsLabel = String(ex.reps).includes('s') || String(ex.reps).includes('min') || String(ex.reps).includes('ronda') || ex.reps === 'al fallo'
                ? ex.reps
                : `${ex.reps} reps`;
            res += `  • ${ex.nombre} — ${ex.series}x${repsLabel}\n`;
        });
    });

    // Consejo según objetivo
    if (goal === 'Ganar músculo') {
        res += `\n⚠️ *Consejo pro*: Descansa 90-120s entre series. Intenta progresar en peso o reps cada semana.`;
    } else if (goal === 'Perder peso') {
        res += `\n⚠️ *Consejo pro*: Descansa solo 45s entre series. Añade 15 min de cardio al terminar.`;
    } else {
        res += `\n⚠️ *Consejo pro*: Descansa 60s entre series. Prioriza la técnica perfecta sobre el peso.`;
    }

    return res;
}

// ─────────────────────────────────────────────
// FUNCIONES AUXILIARES
// ─────────────────────────────────────────────
function normalizeText(text) {
    return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function extractMuscles(text) {
    const found = [];
    const lowerText = normalizeText(text);
    for (const [muscle, keywords] of Object.entries(MUSCLE_DB)) {
        for (const keyword of keywords) {
            if (lowerText.includes(normalizeText(keyword))) {
                found.push(muscle);
                break;
            }
        }
    }
    return found;
}

function getTelegramTag(msg) {
    if (msg.from && msg.from.username) {
        return `@${msg.from.username}`;
    }
    if (msg.from && msg.from.first_name) {
        return msg.from.first_name;
    }
    return 'gymbro';
}

// ─────────────────────────────────────────────
// INICIALIZACIÓN DEL BOT
// ─────────────────────────────────────────────
const bot = new TelegramBot(token, { polling: true });

console.log("🦾 Gymbro Bot encendido y listo para machacar...");

// ─────────────────────────────────────────────
// MÁQUINA DE ESTADOS PRINCIPAL
// ─────────────────────────────────────────────
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Protección: Si el mensaje no tiene texto (foto, sticker, etc), ignorar
    if (!text) return;

    // Si es un comando de Telegram, ignorar aquí (lo maneja bot.onText)
    if (text.startsWith('/')) return;

    if (!users[chatId]) {
        users[chatId] = { step: 'START', workouts: [] };
    }

    const user = users[chatId];

    switch (user.step) {
        case 'START': {
            user.workouts = [];
            const tag = getTelegramTag(msg);
            user.name = tag;
            bot.sendMessage(chatId, `¡Eseee ${tag}! ¡Ya se te echaba de menos!.\n\nSoy tu coach personal. Para empezar, ¿cuánto pesas actualmente? (en kg, solo el número)`);
            user.step = 'WEIGHT';
            break;
        }

        case 'WEIGHT':
            user.weight = text;
            bot.sendMessage(chatId, "Perfecto. ¿Y cuál es tu objetivo principal?", {
                reply_markup: {
                    keyboard: [['Ganar músculo 💪', 'Perder peso 🏃', 'Mantenerme ⚖️']],
                    one_time_keyboard: true
                }
            });
            user.step = 'GOAL';
            break;

        case 'GOAL':
            user.goal = text;
            bot.sendMessage(chatId, "¡Tomo nota! Vamos al lío... ¿Qué músculo vamos a machacar hoy?", {
                reply_markup: { remove_keyboard: true }
            });
            user.step = 'WORKOUT';
            break;

        case 'WORKOUT': {
            const musclesFound = extractMuscles(text);
            if (musclesFound.length > 0) {
                musclesFound.forEach(m => {
                    if (!user.workouts.includes(m)) user.workouts.push(m);
                });
                bot.sendMessage(chatId, `¡${musclesFound.join(" y ").toUpperCase()} anotado! ✍️ ¿Algo más o ya le damos caña?`, {
                    reply_markup: {
                        keyboard: [['¡Listo, dame el plan!'], ['Hombro', 'Espalda', 'Pierna', 'Brazo']],
                        one_time_keyboard: true
                    }
                });
                user.step = 'WORKOUT_CONFIRM';
            } else {
                bot.sendMessage(chatId, "No te he pillado, bro... 🤨 ¿Qué músculo vamos a machacar? (Pecho, Brazo, Pierna, Espalda, Hombro, Abdominales, Cardio)");
            }
            break;
        }

        case 'WORKOUT_CONFIRM': {
            if (normalizeText(text).includes('listo') || normalizeText(text).includes('cana') || normalizeText(text).includes('plan')) {
                if (user.workouts.length === 0) {
                    bot.sendMessage(chatId, "¡Pero si no me has dicho qué vas a entrenar! 😂 Dime un músculo primero.");
                    user.step = 'WORKOUT';
                    return;
                }
                const combinedWorkout = user.workouts.join(", ");
                const recommendations = getRecommendations(user.goal, user.workouts);
                const numExs = user.workouts.length === 1 ? 5 : user.workouts.length === 2 ? 4 : 3;

                bot.sendMessage(chatId,
                    `🔥 *¡PLANIFICACIÓN LISTA PARA ${user.name.toUpperCase()}!* 🔥\n\n` +
                    `Peso actual: ${user.weight}kg\n` +
                    `Objetivo: ${user.goal}\n` +
                    `Hoy machacamos: ${combinedWorkout.toUpperCase()}\n` +
                    `Ejercicios por grupo: ${numExs}\n\n` +
                    `*Tus ejercicios de hoy:*\n${recommendations}\n\n` +
                    `¿Necesitas que te explique algún ejercicio? Escribe su nombre y te lo detallo. Cuando acabes, escribe *listo*.`,
                    { parse_mode: 'Markdown', reply_markup: { remove_keyboard: true } }
                );
                user.step = 'EXPLAIN';
            } else {
                const moreMuscles = extractMuscles(text);
                if (moreMuscles.length > 0) {
                    moreMuscles.forEach(m => {
                        if (!user.workouts.includes(m)) user.workouts.push(m);
                    });
                    bot.sendMessage(chatId, `¡${moreMuscles.join(" y ").toUpperCase()} añadido! ¿Algún otro o ya estamos?`, {
                        reply_markup: {
                            keyboard: [['¡Listo, dame el plan!'], ['Brazo', 'Hombro', 'Cardio', 'Abdominales']],
                            one_time_keyboard: true
                        }
                    });
                } else {
                    bot.sendMessage(chatId, "Si ya has terminado, pulsa el botón o dime 'listo'. Si no, dime qué otro músculo toca.");
                }
            }
            break;
        }

        case 'EXPLAIN': {
            const search = normalizeText(text);

            // Comprobar si el usuario quiere terminar (palabras exactas, sin falsos positivos)
            const wantToFinish = /\blisto\b/.test(search) || /\bgracias\b/.test(search) || search.trim() === 'no';
            if (wantToFinish) {
                bot.sendMessage(chatId, "¡De nada, bro! A darle duro. ¡Nos vemos en el próximo entreno! 🦾🔥\n\nEscribe /start cuando quieras planificar otra sesión.");
                user.step = 'FINISH';
                return;
            }

            // Buscar explicación del ejercicio mencionado
            let found = false;
            for (const [ex, desc] of Object.entries(EXPLANATIONS)) {
                if (search.includes(normalizeText(ex))) {
                    bot.sendMessage(chatId,
                        `🧠 *EXPLICACIÓN: ${ex.toUpperCase()}*\n\n${desc}\n\n¿Alguna duda más? Escribe el nombre del ejercicio o di *listo* para terminar.`,
                        { parse_mode: 'Markdown' }
                    );
                    found = true;
                    break;
                }
            }

            if (!found) {
                // Si no es un ejercicio concreto, comprobar si pregunta por un grupo muscular
                const musclesAsked = extractMuscles(text);
                if (musclesAsked.length > 0) {
                    const muscle = musclesAsked[0];
                    const pool = EXERCISE_BANK[muscle] || [];
                    const lista = pool.map(e => `  • ${e.nombre}`).join('\n');
                    bot.sendMessage(chatId,
                        `🏋️ *Ejercicios de ${muscle.toUpperCase()} disponibles:*\n\n${lista}\n\nEscribe el nombre de cualquiera y te explico cómo hacerlo. O di *listo* para terminar.`,
                        { parse_mode: 'Markdown' }
                    );
                } else {
                    bot.sendMessage(chatId, "No tengo la explicación de ese ejercicio exacto, pero búscalo en YouTube y seguro que lo clavas 💪 ¿Algún otro o terminamos?");
                }
            }
            break;
        }

        case 'FINISH': {
            const search = normalizeText(text);

            // Si pregunta por un ejercicio o músculo concreto, responder y quedarse en FINISH
            let foundEx = false;
            for (const [ex, desc] of Object.entries(EXPLANATIONS)) {
                if (search.includes(normalizeText(ex))) {
                    bot.sendMessage(chatId,
                        `🧠 *EXPLICACIÓN: ${ex.toUpperCase()}*\n\n${desc}\n\n¿Algo más? Escribe otro ejercicio o /start para nueva sesión.`,
                        { parse_mode: 'Markdown' }
                    );
                    foundEx = true;
                    break;
                }
            }

            // Si pregunta por cardio u otro grupo muscular en general
            if (!foundEx) {
                const musclesAsked = extractMuscles(text);
                if (musclesAsked.length > 0) {
                    const muscle = musclesAsked[0];
                    const pool = EXERCISE_BANK[muscle] || [];
                    const lista = pool.map(e => `  • ${e.nombre}`).join('\n');
                    bot.sendMessage(chatId,
                        `🏋️ *Ejercicios de ${muscle.toUpperCase()} disponibles:*\n\n${lista}\n\nEscribe el nombre de cualquiera y te explico cómo hacerlo. O /start para nueva sesión.`,
                        { parse_mode: 'Markdown' }
                    );
                } else {
                    bot.sendMessage(chatId, "¿Quieres planificar otro entrenamiento? Escribe /start 💪");
                    user.step = 'START';
                }
            }
            break;
        }
    }
});

// Comando /start explícito
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const tag = getTelegramTag(msg);
    users[chatId] = { step: 'WEIGHT', workouts: [], name: tag };
    bot.sendMessage(chatId, `¡Eseee ${tag}! ¡Ya se te echaba de menos!.\n\nSoy tu coach personal. Para empezar, ¿cuánto pesas actualmente? (en kg, solo el número)`);
});