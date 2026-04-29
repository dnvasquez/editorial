// ============================================================
//  FUENTE ÚNICA DE DATOS — Estación Rural
//  Para agregar contenido nuevo, edita solo este archivo.
//  Orden: el elemento [0] de EPISODIOS es el más reciente.
// ============================================================

var PROGRAMAS = [
  {
    id: "ceguera-digital",
    nombre: "Ceguera digital y territorio",
    descripcion: "Exploramos el choque entre las herramientas tecnológicas digitales y la realidad del territorio.",
    imagen: "images/portada_podcast_1.jpg",
    frecuencia: "Mensual"
  },
  {
    id: "territorio-rural",
    nombre: "La Cuestión Rural Latinoamericana",
    descripcion: "Examinamos la ruralidad latinoamericana desde perspectivas que articulan saberes campesinos, políticas públicas e innovación territorial.",
    imagen: "images/portada_podcast_2.png",
    frecuencia: "Quincenal"
  },
  {
    id: "publico-privado",
    nombre: "Sin nombre",
    descripcion: "Análisis crítico de fenómenos económicos y su impacto en la vida cotidiana. Con economistas y analistas.",
    imagen: "images/img_3.jpg",
    frecuencia: "Semanal"
  }
];

var EPISODIOS = [
  // ── Para agregar un episodio nuevo, copia este bloque y pégalo al inicio del array ──
   {
    id: "ep02",                          // ID único
    programaId: "ceguera-digital",       // ID del programa al que pertenece
    numero: "02",
    titulo: "¿Integrar la naturaleza o intensificar los cultivos?",
    autor: "David A. Vásquez Stuardo",
    fecha: "01 Abril 2026",
    duracion: "22:20",
    imagen: "images/portada_podcast_1.jpg",
    audio: "https://archive.org/download/integrar-la-naturaleza-o-intensificar-los-cultivos/%C2%BFIntegrar_la_naturaleza_o_intensificar_los_cultivos_.m4a",
    resumen: "Un debate profundo sobre cómo gestionar los paisajes agrícolas más allá de los límites del predio, confrontando dos visiones: integrar la naturaleza dentro de los sistemas productivos mediante enfoques regenerativos, o intensificar la producción para liberar áreas destinadas a la conservación.",
    transcripcion: [
      { locutor: "Locutor 1", texto: "Bienvenidos. Hoy quiero que imagines por un momento que tomas un plano topográfico de un territorio agrícola y trazas una línea recta con tinta roja. De un lado de esa línea tienes hectáreas de cultivos comerciales, digamos perfectamente alineados, y del otro lado un parche de bosque salvaje o una reserva natural." },
      { locutor: "Locutor 2", texto: "Una imagen muy clásica. Claro." },
      { locutor: "Locutor 1", texto: "Totalmente. Durante más de un siglo operamos bajo la ilusión administrativa de que si manteníamos esa línea física intacta, el famoso cerco perimetral, la naturaleza estaría a salvo afuera y nuestra producción estaría garantizada dentro. Nos daba una falsa, pero muy reconfortante sensación de control sobre el ecosistema, y es una categorización muy limpia en el papel. A los seres humanos y, bueno, especialmente a los legisladores, nos fascina lo que se puede medir y delimitar con coordenadas geográficas. El problema es que luego das un paso hacia el mundo real, entras en el terreno de la hidrología, de la entomología, de los ciclos biogeoquímicos y de repente ese cerco de alambre desaparece por completo." },
      { locutor: "Locutor 2", texto: "Desaparece." },
      { locutor: "Locutor 1", texto: "Exacto. Los nitratos que se filtran en el suelo no se detienen donde termina la propiedad. O sea, el agua fluye, los polinizadores cruzan kilómetros al día y te aseguro que las plagas ciertamente no respetan los límites catastrales." },
      { locutor: "Locutor 2", texto: "Exactamente. Y es por eso que la gestión agrícola tradicional está fallando. Se enfoca de manera exclusiva en el predio individual. Hoy nos encontramos en las aguas turbias de la ecología espacial, intentando entender la agricultura como algo que trasciende de manera absoluta los límites del cerco. Esto nos plantea un rompecabezas sociopolítico y técnico monumental basado en la literatura actual sobre el diseño de paisajes." },
      { locutor: "Locutor 1", texto: "Así es." },
      { locutor: "Locutor 2", texto: "La pregunta central que vamos a explorar hoy es, ¿cómo debemos gestionar física y políticamente estos paisajes agrícolas? Por un lado, deberíamos rediseñar todo bajo el concepto de uso compartido de tierras, integrando la naturaleza de forma intrínseca en cada parcela. O por el contrario, deberíamos apostar por el ahorro de tierras intensificando áreas específicas con alta tecnología para liberar grandes bloques intactos para la conservación. Yo, como defensora del uso compartido, sostengo que la agricultura regenerativa es el camino." },
      { locutor: "Locutor 1", texto: "Y yo desde mi trinchera analizo este problema desde la lente del ahorro de tierras y la intensificación ecológica. Mi lectura de la evidencia histórica y agronómica me dice que maximizar el rendimiento mediante innovación tecnológica en espacios reducidos es la vía más pragmática. Es la forma real de proteger la biodiversidad estricta sin comprometer la seguridad alimentaria mundial ni arruinar financieramente al agricultor en el proceso." },
      { locutor: "Locutor 2", texto: "Entiendo ese enfoque pragmático, de verdad lo entiendo, pero yo lo veo desde la vereda opuesta. Sostengo que el uso compartido de tierras a través de la agricultura regenerativa es la única salida sistémica. Para mí no podemos seguir aislando a la naturaleza en reservas intocables. O sea, todo el paisaje productivo debe transformarse en una matriz multifuncional e integrada. Empecemos estableciendo los cimientos." },
      { locutor: "Locutor 1", texto: "Adelante." },
      { locutor: "Locutor 2", texto: "Desde la ecología del paisaje, el territorio no es una hoja en blanco donde ponemos fábricas de comida. Es una superficie terrestre heterogénea compuesta por ecosistemas en interacción constante, forjada por el clima y la geomorfología. El problema es que el modelo agrícola intensivo impuso una dominancia antrópica tan brutal que simplificó drásticamente el paisaje." },
      { locutor: "Locutor 1", texto: "A ver, espera, ¿a qué te refieres exactamente con simplificó drásticamente? Porque, bueno, la homogeneidad también trajo la escalabilidad que hoy alimenta a 8,000 millones de personas. No podemos ignorar eso." },
      { locutor: "Locutor 2", texto: "Claro, produjo calorías, sí, pero me refiero a que al fragmentar los hábitats para crear monocultivos gigantescos provoca efectos en cascada que destruyen las funciones ecosistémicas de soporte y regulación. Mi punto es que debemos rediseñar el sistema productivo desde su núcleo y esto significa eliminar la dependencia de los insumos sintéticos que interrumpen la biología del suelo. En lugar de, digamos, inyectar nitrógeno de una fábrica, dependamos de la fijación biológica de nitrógeno a través de leguminosas." },
      { locutor: "Locutor 1", texto: "Ajá." },
      { locutor: "Locutor 2", texto: "En lugar de ver los rastrojos como basura, hablemos de un reciclaje profundo de residuos y de la integración de animales en el campo, manejados sin hormonas. El objetivo es que la producción de alimentos nutritivos y la conservación ambiental ocurran en el mismo metro cuadrado." },
      { locutor: "Locutor 1", texto: "A ver, detengámonos ahí porque es una visión muy romántica, de verdad, pero francamente yo no compro esa idea del cero insumos universal. Y déjame explicarte por qué. La premisa de rediseñar todo el sistema alimentario global basándonos en métodos absolutos de regeneración extrema ignora las realidades matemáticas de la demanda de biomasa y la eficiencia termodinámica. Si eliminas de golpe los insumos sintéticos, el rendimiento por hectárea cae. Y si el rendimiento cae, pero la población sigue comiendo, ¿qué pasa?" },
      { locutor: "Locutor 2", texto: "Asumes que los rendimientos caen invariablemente, lo cual la agroecología ha demostrado que no siempre es cierto a largo plazo." },
      { locutor: "Locutor 1", texto: "A corto y mediano plazo, que es cuando ocurren las crisis alimentarias, la caída es muy real. Empíricamente corremos el altísimo riesgo de desplazar la frontera agrícola. Es decir, para producir lo mismo sin insumos tendríamos que talar más bosques. Los datos de la FAO y de diversas instituciones agronómicas son clarísimos en esto. Entre 1961 y 2015, las tecnologías mejoradas de cultivo y las semillas de alto rendimiento redujeron la necesidad de expandir las tierras de cultivo a nivel mundial en 16 millones de hectáreas." },
      { locutor: "Locutor 2", texto: "16 millones." },
      { locutor: "Locutor 1", texto: "Sí, 16 millones de hectáreas de hábitat salvadas. Ese es el núcleo conceptual del ahorro de tierras. Usamos la tecnología para concentrar el impacto, logrando rendimientos máximos en superficies mucho menores. Y así liberamos tierra real para la conservación formal. Porque seamos honestos, un bosque primario no perturbado alberga un nivel de biodiversidad endémica que tu campo de cultivo diversificado, por más hermoso que sea, jamás podrá igualar." },
      { locutor: "Locutor 2", texto: "Veo por qué piensas eso y entiendo perfectamente el atractivo de la matemática pura. Ya sabes, produzco más aquí, salvo un bosque allá, pero permíteme ofrecerte una perspectiva diferente sobre cómo funciona realmente el espacio físico. Gestionar la ecología agrícola separando la granja del bosque es como intentar tratar el sistema circulatorio de un paciente separando las venas de los órganos." },
      { locutor: "Locutor 1", texto: "Es una buena metáfora, muy visual, pero..." },
      { locutor: "Locutor 2", texto: "Déjame llevarla hasta el final porque esto es vital para entender el uso compartido. Si bloqueas una vena principal, el órgano muere, sin importar qué tan sano esté ese órgano de forma aislada. De la misma manera, si cortamos los corredores biológicos, si ponemos un monocultivo estéril y químicamente agresivo entre dos parches de bosque, colapsamos el flujo de polinizadores. Frenamos la dispersión de semillas que mantienen vivo a ese bosque." },
      { locutor: "Locutor 1", texto: "Claro, interrumpes el flujo." },
      { locutor: "Locutor 2", texto: "Exacto. La resiliencia no proviene de tener un bloque de reserva intacta a 50 km de distancia. La resiliencia emerge cuando diversificamos la matriz misma. Hablo de agroforestería, policultivos, franjas florales en los márgenes. Esa infraestructura verde provee control biológico natural in situ, retiene el agua en el perfil del suelo y evita la erosión. Las investigaciones recientes demuestran que esta multiplicidad de intervenciones genera beneficios conjuntos sin sacrificar necesariamente el rendimiento. Es, o sea, es el mosaico complejo lo que asegura que el ecosistema aguante los golpes climáticos." },
      { locutor: "Locutor 1", texto: "Me gusta la analogía médica de las venas y los órganos, te lo concedo. Pero te diría que siguiendo esa línea, si el paciente tiene una infección sistémica grave, no le das tés de hierbas esperando que su cuerpo se regule solo, usas un antibiótico dirigido de amplio espectro." },
      { locutor: "Locutor 2", texto: "Pero la agricultura no es una enfermedad radical." },
      { locutor: "Locutor 1", texto: "Lo que en la literatura llamamos trade-offs." },
      { locutor: "Locutor 2", texto: "¿Te refieres a los costos ocultos de diversificar?" },
      { locutor: "Locutor 1", texto: "Me refiero a lo que vemos cuando cruzamos los datos de rendimiento con los sistemas de información geográfica. El uso compartido de tierras a menudo disminuye la producción potencial neta. Un ejemplo clásico son las regulaciones sobre pastizales naturales." },
      { locutor: "Locutor 2", texto: "Ah, sí, el tema del pastoreo." },
      { locutor: "Locutor 1", texto: "Exacto. Cuando obligamos al productor a reducir la carga animal, o sea, la intensidad del pastoreo para acomodar hábitats de aves nidificantes, la producción de proteínas por hectárea se desploma. Y volvemos al problema matemático global. Si diluimos nuestra capacidad productiva extendiendo prácticas de menor rendimiento sobre áreas inmensas, nuestra huella agrícola total crece. Esos setos florales y corredores están muy bien para los polinizadores generalistas, los que se adaptan a todo. Pero la conservación estricta, la que salva especies al borde de la extinción, requiere ecosistemas sin perturbación humana. Mezclar la producción y la conservación a medias tintas nos deja con un paisaje subóptimo. Ni producimos alimentos a gran escala con máxima eficiencia, ni logramos una conservación ecológica profunda." },
      { locutor: "Locutor 2", texto: "Pero fíjate en la trampa de esa lógica. ¿Estás asumiendo que el humano solo puede ser una fuerza destructiva de la cual la naturaleza necesita ser salvada mediante el aislamiento? Y eso me lleva directamente a la dimensión socioeconómica, a la ciencia de la sustentabilidad real, porque cualquier configuración en el territorio requiere que individuos de carne y hueso, o sea, comunidades enteras, la implementen." },
      { locutor: "Locutor 1", texto: "¿Cierto? El factor humano es clave." },
      { locutor: "Locutor 2", texto: "La agricultura regenerativa y el uso compartido exigen una relación estrecha con el territorio. Esto no es solo biología, es empleo rural, es autosuficiencia local, es revitalizar el tejido social agrario." },
      { locutor: "Locutor 1", texto: "Lo cual es muy loable, estoy de acuerdo. Pero, ¿cómo lo escalas económicamente a nivel global?" },
      { locutor: "Locutor 2", texto: "A través de políticas públicas integrales. Esto no ocurre en el vacío. Si queremos trascender el predio individual, tenemos que gestionar a nivel de cuenca hidrográfica. Si un agricultor regenera sus suelos aguas arriba, el que está aguas abajo sufre menos inundaciones. Necesitamos políticas basadas en incentivos, pagos por servicios ecosistémicos reales y, sobre todo, mecanismos de coordinación interministerial, porque hoy en día el Ministerio de Agricultura te subsidia los fertilizantes, mientras el Ministerio de Medio Ambiente te multa por contaminar el río. Es esquizofrénico. Solo con una planificación territorial que alinee incentivos desde el Estado hacia las comunidades, la agricultura pasa de ser el problema a ser el motor de restauración." },
      { locutor: "Locutor 1", texto: "Yo abordo esa política desde un ángulo mucho más escéptico. El idealismo de la revitalización rural suele chocar de frente con un muro de ladrillo llamado costos de transición. Cuando hablas de políticas de incentivos para pasar a cero labranza o cero pesticidas, estás ignorando el abismo financiero que debe cruzar el productor." },
      { locutor: "Locutor 2", texto: "Bueno, es un cambio gradual." },
      { locutor: "Locutor 1", texto: "Pero no solo un cambio de filosofía en su cabeza. Requiere capital para maquinaria totalmente nueva. Enfrenta una curva de aprendizaje donde estadísticamente perderá cosechas los primeros años. Y hoy por hoy no existen mecanismos de seguros agrícolas que cubran ese riesgo de transición a gran escala." },
      { locutor: "Locutor 2", texto: "Por eso mencionaba que el Estado debe acompañar ese riesgo. Es una inversión pública." },
      { locutor: "Locutor 1", texto: "Pero hasta que el Estado tenga esos fondos y los asigne eficientemente, el productor quiebra. Por eso sostengo que si queremos proteger el paisaje a gran escala rápidamente, las políticas reglamentarias, las famosas políticas de comando y control son mucho más directas. Hablo de zonificación estricta por deforestación absoluta y mandatos jurídicos innegociables." },
      { locutor: "Locutor 2", texto: "Eso suele generar rechazo en el campo." },
      { locutor: "Locutor 1", texto: "Totalmente. No soy ciego. Reconozco el peligro de los incentivos perversos. Si diseñas mal una ley de conservación, el productor fragmenta artificialmente su finca en los papeles para eludir la regulación. Pero aún con esos riesgos, establecer una línea clara sobre dónde se produce de forma intensiva y tecnológica y dónde está estrictamente prohibido tocar un árbol es institucionalmente mucho más viable que intentar microgestionar el despertar ecológico de millones de agricultores individuales." },
      { locutor: "Locutor 2", texto: "Me cuesta mucho aceptar esa línea de razonamiento porque la historia nos demuestra que las políticas de comando y control fracasan sistemáticamente cuando ignoran la biología del territorio. Obligar a un agricultor a dejar un 20% de su campo intacto mientras le permites esterilizar químicamente el 80% restante no detiene la degradación. De hecho, hoy casi el 30% de las tierras de secano y el 50% de las tierras de regadío en el mundo sufren algún grado de degradación severa. El cerco no retiene el suelo muerto." },
      { locutor: "Locutor 1", texto: "Es una cifra alarmante, sin duda." },
      { locutor: "Locutor 2", texto: "Para que cualquier política funcione, necesitamos cambiar cómo el agricultor mide su propio éxito. Y paradójicamente aquí es donde creo que la tecnología y la cuantificación que tú defiendes para el modelo intensivo pueden ser el gran puente hacia el modelo regenerativo." },
      { locutor: "Locutor 1", texto: "Exactamente. La cuantificación es el puente crítico y me alegra que llegues a este punto porque es donde la intensificación ecológica de precisión demuestra por qué es superior metodológicamente. Para gestionar un territorio a nivel de cuenca hay que poder medirlo con rigor. Hoy ya no dependemos del instinto del agricultor. Contamos con herramientas digitales basadas en el análisis de ciclo de vida y en normativas como la ISO 14067. Pensemos en plataformas apoyadas por la FAO como Exact o el Cool Farm Tool." },
      { locutor: "Locutor 2", texto: "Hagamos una pequeña pausa ahí para que no nos perdamos en la jerga técnica. Cuando hablas de estas plataformas, estamos hablando de software que mide, por ejemplo, las famosas emisiones de alcance 1, 2 y 3, ¿verdad?" },
      { locutor: "Locutor 1", texto: "Precisamente. Y para ponerlo en términos superprácticos, el alcance uno es el diésel que quema el tractor o el metano de la fermentación entérica, es decir, la digestión directa de las vacas ahí mismo en el campo. El alcance dos son las emisiones de la electricidad que compraste, digamos, para bombear agua de un pozo. Y el alcance tres es toda la huella de lo que ocurre fuera de tu granja, como la fabricación en otro país de los fertilizantes que compraste. Estas herramientas lo miden todo." },
      { locutor: "Locutor 2", texto: "¿De acuerdo? Miden la huella del daño." },
      { locutor: "Locutor 1", texto: "Miden la huella para optimizarla, no solo para lamentarla. Vamos más al campo operativo. Sistemas como el EOSDA Crop Monitoring. Esta tecnología utiliza constelaciones de satélites para medir algo llamado NDVI, el índice de vegetación de diferencia normalizada. Básicamente, lee la reflectancia de la luz en las hojas para decirte exactamente qué tan verde, vigorosa y sana está una planta en un cuadrante de 1 m²." },
      { locutor: "Locutor 2", texto: "Ajá. Agricultura de ultra precisión." },
      { locutor: "Locutor 1", texto: "Exacto. Con esto, un tractor equipado con inteligencia artificial no rocía fertilizantes sintéticos de manera uniforme. Por lo tanto, aplica potasio y fósforo con tasas variables milimétricas, dosis mínimas donde el suelo es rico y un poco más donde la planta lo exige. Esto demuestra empíricamente que la respuesta para la sostenibilidad no es el dogma de eliminar los insumos, sino usar la era digital para optimizarlos, maximizando el rendimiento y cortando de tajo la escorrentía de químicos hacia el río." },
      { locutor: "Locutor 2", texto: "A ver, es una maravilla técnica, no te lo niego. Entiendo cómo funciona el NDVI y la aplicación de tasa variable. Es fascinante, pero difiero profundamente en el propósito filosófico que le estás dando a esa tecnología. Usar satélites de última generación y constelaciones orbitales simplemente para calcular cuántos gramos de fósforo sintético escupir sobre una tierra biológicamente muerta es francamente un desperdicio de nuestro potencial científico." },
      { locutor: "Locutor 1", texto: "Un desperdicio, pero optimizar el recurso salva ecosistemas enteros, ¿cómo usarías tú esta tecnología entonces?" },
      { locutor: "Locutor 2", texto: "Validando los procesos vivos. Fíjate en sistemas como FAMEWS, otra herramienta desarrollada por la FAO que surgió tras la devastación del gusano cogollero del maíz. FAMEWS no es un algoritmo para decidir dónde rociar más insecticida venenoso. Es un sistema mundial de alerta temprana que procesó más de 50,000 exploraciones de campo y datos de miles de trampas de feromonas conectadas a la nube. Usa inteligencia artificial para entender la dinámica poblacional de la plaga a escala continental." },
      { locutor: "Locutor 1", texto: "Claro, el monitoreo biológico es clave." },
      { locutor: "Locutor 2", texto: "O pensemos en la plataforma que utiliza la observación de la tierra para monitorear la productividad del agua con una resolución de 10 días, midiendo la evapotranspiración real..." },
      { locutor: "Locutor 1", texto: "Es decir, midiendo cuánta agua se evapora del suelo y cuánta transpira la planta..." },
      { locutor: "Locutor 2", texto: "Exacto. Y saber eso cada 10 días a nivel regional es lo que evita que sequemos los acuíferos. Estas plataformas agroinformáticas nos permiten cuantificar los servicios que provee la infraestructura verde de la que hablaba antes. Podemos medir matemáticamente cuánta humedad extra retiene un sistema agroforestal frente a un monocultivo. Podemos usar la altísima tecnología no para inyectar química con precisión quirúrgica, sino para gestionar la inmensa complejidad biológica de la naturaleza. Y con esos datos en la mano podemos finalmente abandonar el modelo sintético con total seguridad económica." },
      { locutor: "Locutor 1", texto: "Es un punto fascinante, pero fíjate que al final del día ese nivel de sofisticación en el monitoreo digital que ambos celebramos es lo que hace posible auditar nuestras políticas independientemente de la ideología agrícola que prefiramos. Ya sea que estemos midiendo la resiliencia hídrica de un policultivo complejo regenerativo o la eficiencia milimétrica de un cultivo intensivo de cerezos de exportación, son las bases de datos masivas las que deben guiar la gestión territorial. En eso estamos totalmente de acuerdo, los datos deben guiar la política, y creo que eso nos lleva a la necesidad de sintetizar nuestras posiciones sobre este monumental desafío. Desde mi perspectiva analítica concluyo que la intensificación ecológica, fuertemente apoyada en datos duros, tecnología de precisión y una planificación de uso de suelo restrictiva ofrece el camino más pragmático. Al optimizar los rendimientos donde la Tierra ya está transformada y es apta, podemos blindar jurídicamente los ecosistemas vulnerables, deteniendo en seco el avance de la frontera agrícola y asegurando la comida para un mundo en constante crecimiento." },
      { locutor: "Locutor 2", texto: "Y desde mi orilla reitero que pretender salvar la biosfera encapsulando la naturaleza lejos de nosotros es un error conceptual. Difuminar de manera planificada los límites entre lo agrícola y lo natural a través de una regeneración sistémica de los suelos y la biodiversidad es la única garantía de resiliencia a largo plazo. Si empezamos a concebir la agricultura no como un devorador de recursos naturales, sino como un proveedor activo de servicios ecosistémicos. Y si integramos la dignidad socioeconómica de las comunidades rurales en la gestión de estos paisajes en mosaico, crearemos territorios verdaderamente prósperos. Territorios que produzcan alimentos, sí, pero que al mismo tiempo capturen carbono, regulen el clima regional y sostengan una matriz social equitativa." },
      { locutor: "Locutor 1", texto: "Lo que es absolutamente innegable tras debatir los mecanismos de ambos modelos, es que la visión fragmentada y aislacionista del siglo pasado ha caducado, ya sea a través del pragmatismo de separar y superoptimizar espacios mediante el ahorro de tierras o a través del ambicioso enfoque holístico de integrar procesos vivos en cada rincón mediante el uso compartido. Ambos estamos de acuerdo en algo fundamental. Los sistemas naturales operan a una escala enorme que ignora por completo nuestros mapas catastrales y nuestros ministerios." },
      { locutor: "Locutor 2", texto: "Sin duda, y aún quedan muchísimas aristas por explorar en la literatura científica que respalda este tema. Nos queda pendiente el intenso debate sobre qué hacer con las tierras marginales que ya están degradadas o, por ejemplo, las implicaciones de soberanía geopolítica que traen estas nuevas plataformas de inteligencia artificial agrícola. Todo esto invita a una reflexión mucho más profunda." },
      { locutor: "Locutor 1", texto: "Así es. Y con esto cerramos nuestra discusión no declarando a un ganador o un perdedor, sino esperando haber arrojado luz sobre la inmensa complejidad de los mecanismos en juego. Les dejamos la tarea de analizar estas dos perspectivas, de revisar la evidencia y de sacar sus propias conclusiones sobre cómo debe ser el futuro del paisaje agrícola global. Porque al final del día, ese cerco físico que construimos en el campo, esa línea roja rígida que dibujamos en el plano para separar la granja del bosque, no es más que una ilusión administrativa sobre el cuerpo vivo interconectado de la Tierra. Muchas gracias por acompañarnos." }
    ]
  },

  {
    id: "ep01",
    programaId: "ceguera-digital",
    numero: "01",
    titulo: "Ceguera digital ante el paisaje chileno",
    autor: "David A. Vásquez Stuardo",
    fecha: "31 Marzo 2026",
    duracion: "15:25",
    imagen: "images/portada_podcast_1.jpg",
    audio: "https://archive.org/download/ceguera-digital-ante-el-paisaje-chileno/Ceguera_digital_ante_el_paisaje_chileno.m4a",
    resumen: "El choque entre las fronteras de la propiedad privada, la ecología del paisaje y las herramientas digitales de monitoreo agrícola en el bioma mediterráneo chileno.",
    transcripcion: [
      { locutor: "Locutor 1", texto: "Bueno, eh, a ver, ¿de qué sirve limpiar un rincón de la piscina si el resto del agua está sucia? O sea, uno puede, no sé, frotar los azulejos de forma obsesiva, sacar con una red cada hoja de su pequeño cuadrante, pero el agua es al final del día un fluido, todo se mezcla." },
      { locutor: "Locutor 2", texto: "Claro. Las corrientes arrastran todo lo que hay en el fondo." },
      { locutor: "Locutor 1", texto: "Exacto. Y en cuestión de minutos ese gran esfuerzo individual se diluye en la inmensidad del problema. Y sin embargo, cuando intentamos proteger la naturaleza parece que actuamos constantemente como si la agricultura viviera en el vacío. Limpiamos nuestro propio metro cuadrado, ponemos una valla enorme y básicamente cerramos los ojos ante lo que pasa del otro lado." },
      { locutor: "Locutor 2", texto: "Sí, es una ilusión de control, digamos." },
      { locutor: "Locutor 1", texto: "Totalmente. Por eso, en la exploración documental de hoy, vamos a desentrañar por qué esa visión aislada está provocando el colapso de nuestros ecosistemas y también por qué la enorme infraestructura tecnológica que estamos construyendo para supuestamente intentar arreglarlo podría estar completamente ciega ante la realidad biológica del terreno." },
      { locutor: "Locutor 2", texto: "Es que mira, la tendencia a compartimentar el mundo es seductora porque desde un punto de vista puramente administrativo, bueno, facilita mucho la gestión. Trazas una línea en un mapa, eh construyes un cerco físico y decides que tu responsabilidad empieza y termina en esos límites." },
      { locutor: "Locutor 1", texto: "Ajá. El famoso este es mi problema y lo demás no." },
      { locutor: "Locutor 2", texto: "Tal cual. Pero el problema fundamental con este enfoque es que la naturaleza tiene una forma implacable de ignorar la geometría humana. O sea, un flujo de escorrentía subterránea que va eh cargado de nitratos o una población de insectos polinizadores no reconocen una escritura de propiedad, no se van a detener ante un alambre de púas." },
      { locutor: "Locutor 1", texto: "Lo que nos lleva eh directamente al núcleo de nuestra investigación de hoy, porque estamos analizando una serie de apuntes y presentaciones académicas recientes desarrolladas a lo largo de este año que documentan eh este choque frontal, el choque entre las fronteras de la propiedad privada, la verdadera ecología del paisaje y estas nuevas herramientas digitales de monitoreo agrícola." },
      { locutor: "Locutor 2", texto: "Y el contexto global que plantean estos documentos es para ser un bastante sombrío." },
      { locutor: "Locutor 1", texto: "¡Uf! Sí, muy sombrío. Enfrentamos crisis interconectadas como la desaparición masiva de polinizadores por la pérdida de hábitat. Pero a ver, la gran paradoja aquí, el gancho que rompe todos los esquemas tradicionales es que un productor agrícola puede implementar prácticas ecológicas perfectas dentro de su campo y aún así los polinizadores siguen colapsando." },
      { locutor: "Locutor 2", texto: "Exacto. Las acciones individuales, por muy bien intencionadas que sean, simplemente no escalan para resolver el problema real." },
      { locutor: "Locutor 1", texto: "No mueven la aguja. Y eh, ya que establecimos que las acciones aisladas no funcionan, como en la analogía de la piscina, creo que debemos definir qué es exactamente lo que deberíamos estar mirando." },
      { locutor: "Locutor 2", texto: "Bueno, el fracaso de estas acciones aisladas radica en lo que los estudios definen como el enfoque agrícola tradicional. Este modelo eh fomenta una visión fragmentada del territorio donde el manejo de los recursos y los problemas ambientales es puramente reactivo." },
      { locutor: "Locutor 1", texto: "O sea, apagar incendios todo el tiempo." },
      { locutor: "Locutor 2", texto: "Literalmente, si aparece un brote de una plaga, la solución inmediata es rociar un químico en ese parche específico de tierra. Si los niveles de humedad bajan, la respuesta es bueno, perforar un pozo más profundo en esa propiedad. Se buscan soluciones a muy corto plazo para síntomas locales y se ignoran deliberadamente los procesos dinámicos y a gran escala que están ocurriendo a nivel de paisaje." },
      { locutor: "Locutor 1", texto: "Okay, vamos a desempacar esto porque tenemos que redefinir urgentemente qué significa la palabra paisaje en el lenguaje cotidiano. No sé, uno piensa en un paisaje como la vista bonita de una postal, ¿no? O el fondo de pantalla de una computadora." },
      { locutor: "Locutor 2", texto: "Claro. La foto perfecta para redes sociales." },
      { locutor: "Locutor 1", texto: "Exacto. Pero la ecología nos da un marco mucho más riguroso. Los documentos rescatan una definición clásica de unos investigadores de los 80, Forman y Godron. Ellos describen el paisaje como, y cito, una superficie terrestre heterogénea compuesta por un conjunto de ecosistemas en interacción que se repite de forma similar a lo largo del territorio." },
      { locutor: "Locutor 2", texto: "Lo fascinante aquí es cómo eso se traduce en la práctica. Significa que el paisaje no es solo tu hilera de manzanos." },
      { locutor: "Locutor 1", texto: "Ajá." },
      { locutor: "Locutor 2", texto: "Es la hilera de manzanos más la ladera de bosque nativo que la rodea, más el río que cruza el valle, más la carretera pavimentada que interrumpe el drenaje natural. Todo está operando como un solo engranaje gigantesco." },
      { locutor: "Locutor 1", texto: "Sí, son fenómenos que trascienden completamente los límites prediales. O sea, los organismos como los insectos y las aves vuelan a donde quieren. El agua fluye por escorrentía sin pedirle permiso a nadie." },
      { locutor: "Locutor 2", texto: "Y esa interacción constante entre esos componentes es la clave de bóveda de la ecología moderna. Pero eh esta idea evoluciona aún más con una conceptualización que propuso el eco. Farina. Él plantea que los límites del paisaje no son estáticos, no son puramente geográficos, sino que se delimitan en función del proceso o del organismo que sirve de calibrador en un momento dado." },
      { locutor: "Locutor 1", texto: "Espera, espera, vamos a detenernos ahí porque el concepto de un organismo calibrador suena eh completamente contraintuitivo frente a cómo operamos normalmente. Significa que no existe un mapa objetivo de una región agrícola." },
      { locutor: "Locutor 2", texto: "En términos ecológicos, no. No existe uno solo." },
      { locutor: "Locutor 1", texto: "O sea, el mapa cartográfico de una abeja tiene fronteras literalmente distintas a las del mapa de un pájaro o a las del flujo de un nutriente. ¿Cómo se supone que un ser humano administre un pedazo de tierra si los límites cambian drásticamente dependiendo de lo que intentes proteger?" },
      { locutor: "Locutor 2", texto: "Esa es precisamente eh la inmensa fricción que la ecología del paisaje intenta resolver hoy en día. Mira, tomemos como ejemplo el ciclo del nitrógeno." },
      { locutor: "Locutor 1", texto: "A ver." },
      { locutor: "Locutor 2", texto: "Si un productor aplica fertilizantes sintéticos en la cabecera de un valle. El paisaje operativo de ese nitrógeno incluye la capa vegetal inicial, la filtración hacia las napas subterráneas, el caudal del río que atraviesa, no sé, cinco propiedades distintas río abajo y posiblemente el humedal costero donde desemboca a kilómetros de distancia. Para el ciclo del nitrógeno, todos esos propietarios habitan y alteran el mismo espacio funcional." },
      { locutor: "Locutor 1", texto: "O sea, que todos son vecinos del mismo problema." },
      { locutor: "Locutor 2", texto: "Exacto. Por otro lado, si cambiamos el calibrador y miramos a una abeja que forrajea en un radio de 3 km desde su colmena, su paisaje se dibuja en base a la disponibilidad de parches de flores silvestres, monocultivos y eh huertos de zonas periurbanas." },
      { locutor: "Locutor 1", texto: "Es una locura. Los organismos vivos y los nutrientes fluyen dictados por la biología y la topografía, haciendo que las cercas humanas sean irrelevantes. E incluso eh si nos alejamos de la biología estricta y miramos el comportamiento humano, los mercados operan bajo la misma lógica. Las dinámicas de precios regionales, la disponibilidad de mano de obra son fuerzas que trascienden la escala predial." },
      { locutor: "Locutor 2", texto: "Sí, toda finca agrícola es en realidad un nodo atrapado dentro de una red masiva de tres sistemas superpuestos. Tienes los sistemas naturales como los humedales, tienes los agroecosistemas que son los cultivos y los sistemas urbanos rurales. Todo está interconectado." },
      { locutor: "Locutor 1", texto: "Y si el paisaje es tan inmenso y complejo y bueno, requiere que miremos la interacción de todo al mismo tiempo. ¿Cómo demonios puede un agricultor medir su impacto sin volverse loco?" },
      { locutor: "Locutor 2", texto: "Esa es la pregunta del millón. Al aceptar que es imposible gestionar un cultivo ignorando el bosque adyacente, nos enfrentamos a un desafío técnico colosal, especialmente considerando que la agricultura consume cerca del 70% del agua dulce a nivel mundial." },
      { locutor: "Locutor 1", texto: "70% es muchísimo." },
      { locutor: "Locutor 2", texto: "Y es uno de los principales motores de emisión de gases de efecto invernadero. Entonces, la respuesta que domina actualmente la industria para intentar medir esto es la intensificación ecológica mediante herramientas digitales de monitoreo. Estamos viendo el auge de plataformas como Exacto, Comet Farm o la Cool Farm Tool." },
      { locutor: "Locutor 1", texto: "Y aquí es donde se pone realmente interesante, porque el motor analítico de estas plataformas eh se basa en el análisis de ciclo de vida y en los famosos tres alcances o scopes de emisiones. Los documentos que revisamos son súper específicos en cómo aterrizan esto a la realidad del campo." },
      { locutor: "Locutor 2", texto: "Sí, la metodología divide todo para estandarizar la contabilidad ambiental." },
      { locutor: "Locutor 1", texto: "A ver, repasemos esto. El alcance uno son las emisiones directas, lo que ocurre físicamente dentro del terreno del productor. Esto incluye el diésel del tractor, eh los eructos del ganado por la fermentación entérica y el óxido nitroso de los fertilizantes." },
      { locutor: "Locutor 2", texto: "Exacto. Procesos que el agricultor supervisa directamente y luego la complejidad aumenta con el alcance dos." },
      { locutor: "Locutor 1", texto: "Que son las indirectas de energía, ¿cierto?" },
      { locutor: "Locutor 2", texto: "Así es. Contabiliza las emisiones asociadas al consumo de electricidad. Si usas energía de alta tensión para operar sistemas de riego o para los refrigeradores en la planta de empaque, aunque no estés quemando carbón en tu huerto, la termoeléctrica que te alimenta sí lo está haciendo." },
      { locutor: "Locutor 1", texto: "Y el algoritmo te transfiere esa huella contablemente a ti." },
      { locutor: "Locutor 2", texto: "Literalmente. Y finalmente llegamos al alcance tres." },
      { locutor: "Locutor 1", texto: "Que francamente al leer los apuntes, el alcance tres suena como pedirle a alguien que anote cada caloría, macro y micronutriente de su dieta diaria. Pero, o sea, a escala industrial son las emisiones de toda la cadena de valor." },
      { locutor: "Locutor 2", texto: "Sí, aguas arriba y aguas abajo." },
      { locutor: "Locutor 1", texto: "O sea, contabilizar las emisiones de la fábrica en Asia que hizo el fertilizante o el combustible del barco que transporta las cerezas por el océano. Pero voy a ser de abogado del diablo aquí. Esto es una carga administrativa brutal. No es demasiada exigencia para un productor que solo quiere eh mantener sus árboles vivos frente a una sequía." },
      { locutor: "Locutor 2", texto: "Si conectamos esto con el panorama general, la justificación técnica es que los mercados globales y la banca que otorga créditos verdes exigen métricas comparables, quieren ver líneas base auditables. Sin el alcance tres, industrias enteras podrían ocultar su impacto en cadenas de suministro internacionales." },
      { locutor: "Locutor 1", texto: "Claro, el mercado quiere datos duros para certificar. Sin datos verificables, los sellos de ecofriendly en las cajas de frutas son puro marketing vacío." },
      { locutor: "Locutor 2", texto: "Totalmente. El software promete ser ese traductor que convierte el caos biológico en una hoja de cálculo limpia que los financieros puedan entender. Pero el conflicto está ya cuando intentamos usar esa hoja de cálculo. Diseñada con lógica del hemisferio norte en ecosistemas frágiles del sur." },
      { locutor: "Locutor 1", texto: "Y ahí es donde entramos al caso chileno, porque sabiendo que estas calculadoras gigantes existen, surge un problema gravísimo. El caso chileno es el laboratorio perfecto de cómo fracasan los estándares globales cuando chocan con realidades locales." },
      { locutor: "Locutor 2", texto: "Es un caso de estudio fascinante. Chile tiene una industria frutícola masiva de exportación, paltas, uvas, cerezas, cítricos y toda esta potencia está hiperconcentrada en la zona central entre los 30 y 37 grados sur." },
      { locutor: "Locutor 1", texto: "Lo que las fuentes llaman el bioma mediterráneo chileno, ¿no?" },
      { locutor: "Locutor 2", texto: "Exactamente. Es una anomalía climática que existe en muy pocos lugares del mundo y la situación en Chile lleva esta fragilidad al extremo porque atraviesan una megasequía estructural. Llevan más de una década con una crisis hídrica severa." },
      { locutor: "Locutor 1", texto: "Es un ecosistema supertransformado, con poquísima protección y además hay un dato de los apuntes que me dejó helado. Casi el 25% de las especies nativas ahí son endémicas." },
      { locutor: "Locutor 2", texto: "Sí, una de cada cuatro." },
      { locutor: "Locutor 1", texto: "O sea, evolucionaron ahí y no existen en ninguna otra parte del planeta. Entonces, el choque ocurre cuando traes una herramienta como la Cool Farm Tool, impulsada por corporaciones globales y universidades europeas a evaluar este laboratorio evolutivo." },
      { locutor: "Locutor 2", texto: "Especialmente su módulo de biodiversidad. Para calificar si eres sostenible, la herramienta cruza tus datos con una base global llamada Conservation Evidence. Sobre el papel parece fantástico." },
      { locutor: "Locutor 1", texto: "Parece el estándar de oro, sí." },
      { locutor: "Locutor 2", texto: "Pero las investigaciones señalan las falencias. Hay una enorme ausencia de información sobre manejos específicos del bioma mediterráneo chileno. La herramienta demanda respuestas binarias de sí o no, que no capturan los matices y hay escasísima validación local. Entonces, ¿qué significa todo esto en la práctica? Piénsalo con esta analogía. Es como intentar calificar un examen de literatura chilena usando una rúbrica diseñada exclusivamente para poesía británica." },
      { locutor: "Locutor 1", texto: "Es una excelente forma de verlo." },
      { locutor: "Locutor 2", texto: "La herramienta tecnológica es fantástica, pero está ciega. Por ejemplo, eh, imagina que el software te pregunta, \"¿Mantiene usted cubiertas vegetales verdes entre las hileras de sus cultivos? ¿Sí o no?\". En Inglaterra mantener pasto verde es increíble, evita la erosión, suma puntos." },
      { locutor: "Locutor 1", texto: "Pero si ese mismo productor chileno mantiene pasto verde en medio de una mega sequía de 10 años." },
      { locutor: "Locutor 2", texto: "Se le mueren los frutales. Ese pasto competiría letalmente por el agua. La práctica responsable ahí podría ser promover corredores de matorral espinoso nativo. Y el matorral nativo se ve seco y duro la mitad del año, no encaja en la definición europea de un seto vivo." },
      { locutor: "Locutor 1", texto: "Exacto. Entonces, el agricultor marca no en el software y el algoritmo lo castiga con un puntaje bajo, aunque esté protegiendo flora endémica que resiste la sequía." },
      { locutor: "Locutor 2", texto: "Es una ceguera biológica severa. Por eso, el mensaje principal de los investigadores es que salvar la biodiversidad requiere mirar el paisaje completo. Y aunque la tecnología con sus mediciones de alcance uno, dos y tres nos da los ojos para ver el impacto." },
      { locutor: "Locutor 1", texto: "Esos ojos aún necesitan gafas con graduación local." },
      { locutor: "Locutor 2", texto: "Precisamente la tecnología no se puede simplemente imponer. Debe calibrarse biológicamente con la ciencia de cada territorio." },
      { locutor: "Locutor 1", texto: "Bueno, para ir cerrando y dejar a quienes nos escuchan con algo para masticar, iniciamos esta charla hablando de lo inútil que es limpiar un solo rincón de la piscina. Y hoy entendemos que para purificar el agua de todo el ecosistema global estamos construyendo estas calculadoras gigantes. Pero si las plataformas globales que dictan qué alimentos reciben el sello de sostenibles tienen vacíos de datos tan inmensos en el sur global. ¿Quién está escribiendo realmente las reglas de la ecología del futuro?" },
      { locutor: "Locutor 2", texto: "Es una pregunta crítica." },
      { locutor: "Locutor 1", texto: "¿Podrá la inteligencia artificial algún día llenar esos vacíos biológicos locales o estamos destinados a estandarizar y simplificar la naturaleza solo para que quepa ordenadamente en un software corporativo? Es un paisaje complejo el que late más allá de la cerca y hay que seguir cuestionándolo." }
    ]
  }
];

// ============================================================
//  COLUMNAS — Para agregar una columna nueva, copia un bloque
//  y pégalo al inicio del array. El elemento [0] es el más reciente.
// ============================================================

var COLUMNAS = [
   {
    id: "col03",
    titulo: "Suelos degradados, Políticas en Cámara lenta",
    autor: "David A. Vásquez Stuardo",
    fecha: "01 Abril  2026",
    lectura: "6-8 min",
    imagen: "images/col03_img.jpg",
    banner: "images/col03_img.jpg",
    resumen: "El Suelo Sigue Esperando: Dos Años Después, ¿Hemos Avanzado?",
    contenido: [
      "Hace dos años escribí que la restauración de suelos en Chile era una tarea pendiente que requería la atención y el compromiso de todos. Que a menudo nos enfocábamos en bosques y biodiversidad, pero que la salud del suelo era igual de importante, o incluso más, al ser el sostén de toda vida. Esa reflexión sigue siendo válida. Quizás más que nunca.",
      "Lo que ha cambiado es que ahora tenemos números más precisos, más tiempo transcurrido, y un marco legal que finalmente avanza. Pero también tenemos una constatación incómoda: a pesar de que la urgencia era evidente hace dos años, hemos perdido otros 24 meses sin transformaciones estructurales visibles en cómo gobernamos nuestros suelos.",
      "En Chile, el 79% de los suelos nacionales experimenta degradación en algún grado, y el 49% sufre erosión activa. Entre 2000 y 2020, perdimos casi 3 mil millones de toneladas de suelo. Esa cifra no es para reportes olvidados en carpetas ministeriales. Es la medida material de nuestro fracaso colectivo en entender que el suelo no es recurso infinito, sino herencia que heredamos fragmentada y que debemos restaurar.",
      "La Invisibilidad Persiste",
      "Hace dos años escribía que la degradación del suelo es un problema causado por diversas actividades humanas: agricultura intensiva, deforestación, minería. Sigue siendo cierto. Lo que no cambió es la invisibilidad del proceso. A diferencia de un incendio forestal o una inundación, la degradación avanza en silencio, acumulándose debajo de nuestros pies. Y cada hectárea que se pierde o se compacta pierde simultáneamente capacidad de retención de agua, potencial de almacenamiento de carbono, y biodiversidad funcional. Es una pérdida múltiple: agrícola, hidrológica, climática y ecológica.",
      "Lo preocupante no es que no supiéramos esto hace dos años. Es que sigamos sin actuar con la urgencia que los números demandan. Las regiones de Biobío, Maule y La Araucanía concentran 5,57 millones de hectáreas en estado crítico, en zonas que son el corazón productivo del país. Eso no es un problema sectorial. Es un problema nacional.",
      "Lo Que Aprendimos (o Deberíamos Haber Aprendido)",
      "Hace dos años enfatizaba algo que sigue siendo incomprendido por muchos: que la restauración del suelo no implica solamente agregar nutrientes o abono, sino recuperar su estructura, mejorar su capacidad para retener agua, y reintroducir la flora y fauna nativa que lo habita. Dos años después, esa premisa no es menos válida. Si acaso, es más urgente.",
      "El problema es que cuando digo 'flora y fauna nativa', no me refiero solo a especies visibles. Hablo de comunidades microbianas —bacterias, hongos, protozoos— que son el corazón funcional de cualquier suelo vivo. Un suelo degradado no es un recipiente vacío que se llena con fertilizante. Es un sistema ecológico dañado que requiere rehabilitación integral.",
      "La compactación y pérdida de carbono orgánico en suelos agrícolas y forestales intensifican el problema. Un suelo compactado no retiene agua en sequías. Un suelo empobrecido en materia orgánica no almacena carbono. Un suelo sin comunidades microbianas no cicla nutrientes. Estas no son cuestiones separadas. Son síntomas de un mismo mal: el trato del suelo como insumo extractivo, no como capital viviente que debe mantenerse o regenerarse.",
      "Finalmente, Un Marco Legal: Pero ¿Es Suficiente?",
      "Hace dos años, la Ley Marco de Suelos estaba apenas en discusión inicial. Ahora, en 2026, está en Comisión de Hacienda del Senado (primer trámite constitucional), con indicaciones aprobadas en general por la Cámara de Diputados en 2022. Este avance representa algo concreto: Chile finalmente intenta crear un marco regulatorio coherente para lo que hasta ahora era un vacío legal.",
      "Es importante celebrar esto. Durante décadas hemos tenido regulaciones fragmentadas en códigos ambientales, forestales, agrícolas, mineros, pero sin una política nacional unificada que articulara esos esfuerzos. La Ley Marco propone crear una Política Nacional de Gestión Sostenible de Suelos liderada por ODEPA, con énfasis en prevención de contaminación y adaptación climática. Propone Comisiones Macrozonales (Norte, Centro Norte, Centro Sur, Sur y Austral) que contextualicen decisiones según realidades territoriales. Propone un diagnóstico nacional de 75,6 millones de hectáreas. Propone, en cuatro años, evaluar la creación de un Instituto del Suelo que alinee a Chile con estándares OCDE.",
      "Esto es lo que un país serio hace. Pero aquí viene la pregunta incómoda: ¿por qué nos tomó tanto tiempo? Y más importante aún: ¿será suficiente?",
      "La ley lleva cinco años en el Senado. Su tramitación ha sido lenta, con modificaciones continuas. Existe el riesgo real de que se diluya en negociaciones políticas, o que en su versión final carezca de instrumentos financieros suficientes para implementación. Y la efectividad de cualquier ley depende de voluntad política para cumplirla, de presupuestos adecuados, y de capacidades instaladas en territorios. Ninguno de estos tres elementos está garantizado en Chile actualmente.",
      "Iniciativas Complementarias: La Trama Necesaria",
      "Programas como el SIRSD-S del SAG, que cofinancia recuperación de suelos degradados mediante prácticas regenerativas, funcionan en la dirección correcta. El Proyecto GEF de Restauración de Paisajes, que opera en 23 comunas desde Coquimbo hasta Biobío, suma capacidades locales y diagnósticos ecosistémicos. La adhesión de Chile a 'Suelos Vivos de las Américas' vincula ciencia y política de restauración en un nivel continental.",
      "Pero estos esfuerzos siguen siendo islas en un océano de degradación. Son iniciativas valiosas, bien intencionadas, con equipo técnico comprometido. Pero no son suficientes si operan sin marco legal vinculante, sin integración vertical que articule decisiones desde Presidencia hasta municipios, sin presupuestos multisectoriales sostenidos en el tiempo.",
      "Lo que falta es la sinfonía. Tenemos músicos talentosos. Lo que necesitamos es un director y una partitura clara.",
      "El Llamado Que Hicimos Hace Dos Años Sigue Vigente",
      "Concluí aquella columna hace dos años con un llamado: que empresas, gobiernos y la sociedad en general se involucraran en el esfuerzo de restaurar y proteger nuestros suelos. Que juntos podríamos marcar la diferencia y lograr un futuro más sostenible para Chile.",
      "Ese llamado no ha envejecido. Si acaso, se ha tornado más urgente. Pero también más complejo. Porque ahora sabemos que el problema no era solo falta de conciencia. Era falta de marco legal, falta de coordinación institucional, falta de recursos dedicados, falta de incentivos para que agricultores y empresas invirtieran en restauración en lugar de solo en producción.",
      "A Dónde Vamos Desde Aquí",
      "La restauración del suelo sigue siendo una tarea pendiente. Pero es una tarea que ahora tiene, finalmente, un horizonte institucional. La Ley Marco no garantiza éxito. La aprobación de una ley no es garantía de implementación. Pero es condición necesaria. Sin ella, cualquier esfuerzo de restauración seguirá navegando en aguas sin norte regulatorio claro.",
      "Hace dos años escribía que 'la restauración del suelo no solo beneficiará a la agricultura y la biodiversidad, sino también a la calidad de vida de las personas que dependen de ellos'. Eso sigue siendo cierto, pero incompleto. La restauración del suelo también beneficiará a comunidades rurales cuya viabilidad territorial está en riesgo. Beneficiará a ciudades que dependen de agua que fluye desde cuencas donde los suelos se degradan. Beneficiará a naciones que buscan cumplir compromisos climáticos internacionales, sabiendo que carbono en suelos es mitigación concreta.",
      "Lo que ha cambiado en estos dos años no es la urgencia. Es que ahora tenemos un instrumento legal que podría convertir urgencia en acción institucionalizada. Eso no es todo. Pero es más que lo que teníamos.",
      "El suelo sigue esperando. Pero, por primera vez en mucho tiempo, parece que alguien finalmente está escuchando."

    ]
  },
  {
    id: "col02",
    titulo: "Bandas de flores e insectos benéficos",
    autor: "David A. Vásquez Stuardo",
    fecha: "15 Julio  2025",
    lectura: "2 min",
    imagen: "images/col02_img.jpg",
    banner: "images/col02_img.jpg",
    resumen: "¿Las bandas de flores realmente atraen insectos benéficos a los cultivos?",            
    contenido: [
      "Estas fotografías las capturé en un ensayo de campo donde evaluamos la efectividad de especies nativas chilenas para promover insectos benéficos en huertos frutales. A grandes rasgos los resultados fueron los siguientes: especies como la escabiosa, corona de fraile e incienso de campo no solo atrajeron polinizadores, sino también una amplia diversidad de controladores biológicos de plagas.",
      "En base a mi experiencia con biodiversidad funcional en agroecosistemas, he comprobado que las bandas de flores constituyen una herramientas muy efectivas para incrementar poblaciones de enemigos naturales de plagas y polinizadores nativos. La clave está en la selección estratégica de especies: plantas con diferentes épocas de floración, variados tamaños y formas florales, y especialmente, flora nativa que co-evolucionó con nuestros polinizadores y adaptada a las condiciones de nuestros ecosistemas.",
      "Un dato relevante: la mayoría de insectos benéficos necesitan recursos florales (polen y/o néctar) en alguna etapa de su ciclo de vida. Al proporcionarles estos recursos de forma continua, mejoramos significativamente su capacidad de brindar servicios ecosistémicos como control de plagas y polinización.",
      "Se ha observado que especies como la malva de cerro (Sphaeralcea obtusiloba), coralillo (Lycium chilense), chupalla (Eryngium paniculatum), escabiosa y corona de fraile favorecen tanto polinizadores como controladores biológicos.",
      "La agricultura sostenible no se trata solo de producir alimentos, sino de crear sistemas donde la biodiversidad nativa pueda estar presente. Cuando diseñamos predios agrícolas más complejos, todos ganamos.",
      "Para más información sobre estas medidas basadas en la naturaleza los invito a revisar el manual que editamos junto a Alejandra Muñoz o a entablar conversaciones y alianzas para el fomento de biodiversidad.",
      "Enlace al documento: https://lnkd.in/dYjasB23"

    ]
  },
  {
    id: "col01",
    titulo: "Fauna y Agricultura",
    autor: "David A. Vásquez Stuardo",
    fecha: "8 Junio 2025",
    lectura: "2 min",
    imagen: "images/col01_img.jpg",
    banner: "images/col01_img.jpg",
    resumen: "¿Las aves rapaces utilizan las casas anideras? Esta lechuza nos da la respuesta.",
    contenido: [
      "Esta hermosa lechuza asomándose desde su casa anidera instalada entre ramas de un quillay es la prueba viviente de que las estructuras artificiales para aves funcionan cuando están bien diseñadas y ubicadas estratégicamente.",
      "Esta fotografía la tomé en un predio frutícola ubicado en la Región Metropolitana de Chile donde han implementado diversas medidas para fomentar la hashtag#biodiversidad intrapredial (al igual que la percha de la publicación anterior). Estas iniciativas no solo proporcionan refugio a especies beneficiosas como las lechuzas, sino que también generan múltiples hashtag#serviciosecosistémicos para los agricultores.",
      "Durante mi experiencia en el campo de la hashtag#conservación y la hashtag#agriculturasostenible, he podido observar directamente cómo estas simples estructuras pueden transformar un agroecosistema: desde el control biológico de roedores y otras plagas hasta crear conciencia sobre la importancia de estas magníficas aves nocturnas.",
      "Les comparto un dato al respecto, la lechuza (Tyto alba) es una de las aves rapaces más estudiadas globalmente, con investigaciones que demuestran su gran capacidad para controlar poblaciones de roedores. Durante la reproducción, una pareja puede depredar aproximadamente 1.000 roedores. En Chile se ha visto que, al igual que en otras partes del mundo, su dieta en zonas agrícolas del centro-sur está compuesta en su gran mayoría de roedores, lo que permite reducir el daño causado por estas plagas a niveles económicamente no significativos (menos del 5%).",
      "Para tener más información al respecto pueden acceder a esta Guía que editamos hace unos años con Alejandra Muñoz y un gran equipo de investigadoras(es) de la Pontificia Universidad Católica de Chile.",
      "Es momento de promover prácticas que permitan la coexistencia entre producción agrícola y biodiversidad nativa. Al final, todos nos beneficiamos cuando compartimos el hashtag#territorio con quienes lo han habitado desde mucho antes que nosotros."
    ]
  }
];

(function mergeCmsPublishedColumns() {
  var STORAGE_KEY = "editorialCmsColumnas";

  function normalizeDate(dateValue) {
    if (!dateValue) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;

    var cleaned = String(dateValue).replace(/\s+/g, " ").trim();
    var parts = cleaned.split(" ");
    if (parts.length < 3) return cleaned;

    var months = {
      enero: "01",
      febrero: "02",
      marzo: "03",
      abril: "04",
      mayo: "05",
      junio: "06",
      julio: "07",
      agosto: "08",
      septiembre: "09",
      setiembre: "09",
      octubre: "10",
      noviembre: "11",
      diciembre: "12"
    };

    var day = parts[0].padStart(2, "0");
    var month = months[(parts[1] || "").toLowerCase()];
    var year = parts[2];

    if (!month || !/^\d{4}$/.test(year)) return cleaned;
    return year + "-" + month + "-" + day;
  }

  function formatDisplayDate(dateValue) {
    var normalized = normalizeDate(dateValue);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return dateValue || "";

    var date = new Date(normalized + "T12:00:00");
    var months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear();
  }

  function estimateReadingLabel(text) {
    var words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
    var minutes = Math.max(1, Math.ceil(words / 220));
    return minutes + " min";
  }

  function toContentArray(content) {
    if (Array.isArray(content)) return content;
    return String(content || "")
      .split(/\n\s*\n|\r\n\s*\r\n/)
      .map(function (paragraph) { return paragraph.trim(); })
      .filter(Boolean);
  }

  function getCmsColumns() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter(function (column) {
          return column && column.estado === "publicada";
        })
        .map(function (column) {
          var contentArray = toContentArray(column.contenido);
          var joinedContent = contentArray.join(" ");
          return {
            id: column.id,
            titulo: column.titulo || "Sin titulo",
            autor: column.autor || "Autor/a",
            fecha: formatDisplayDate(column.fecha),
            lectura: estimateReadingLabel(joinedContent),
            imagen: column.imagen || "images/col01_img.jpg",
            banner: column.imagen || "images/col01_img.jpg",
            resumen: column.resumen || "",
            contenido: contentArray,
            _sortDate: normalizeDate(column.fecha)
          };
        });
    } catch (error) {
      return [];
    }
  }

  function getBaseColumns() {
    return COLUMNAS.map(function (column) {
      var cloned = {};
      Object.keys(column).forEach(function (key) {
        cloned[key] = column[key];
      });
      cloned._sortDate = normalizeDate(column.fecha);
      return cloned;
    });
  }

  var merged = {};

  getBaseColumns().forEach(function (column) {
    merged[String(column.id)] = column;
  });

  getCmsColumns().forEach(function (column) {
    merged[String(column.id)] = column;
  });

  COLUMNAS = Object.keys(merged)
    .map(function (key) { return merged[key]; })
    .sort(function (a, b) {
      return new Date((b._sortDate || "1900-01-01") + "T12:00:00").getTime() -
        new Date((a._sortDate || "1900-01-01") + "T12:00:00").getTime();
    })
    .map(function (column) {
      delete column._sortDate;
      return column;
    });
})();

// ============================================================
//  PUBLICACIONES — Para agregar una publicación nueva, copia
//  un bloque y pégalo al inicio del array. [0] = más reciente.
// ============================================================

var PUBLICACIONES = [
  {
    id: "pub01",
    titulo: "Biodiversidad y Medioambiente en Certificaciones Agrícolas",
    tipo: "Artículo",
    fecha: "Marzo 2026",
    paginas: "36",
    imagen: "images/pub01_img.png",
    resumen: "Análisis crítico sobre cómo las herramientas globales de certificación agrícola abordan la biodiversidad y el medioambiente en ecosistemas latinoamericanos.",
    enlace: "https://online.fliphtml5.com/otwnk/eBMCA_0326/"
  }
];
