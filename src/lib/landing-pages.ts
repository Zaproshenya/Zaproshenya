export interface LandingPageConfig {
  slug: string;
  metaTitle: string;
  metaDesc: string;
  heroTitlePrefix: string;
  heroTitleHighlight: string;
  heroDesc: string;
  emoji: string;
  eventType: string;
  demoText: string;
  demoLabel: string;
  demoValue: string;
  demoPlace: string;
}

// Base configurations for different event types to generate 60+ variations
interface BaseEventTemplate {
  key: string;
  nameAccusative: string; // e.g. "на весілля"
  nameNominative: string; // e.g. "Весілля"
  emoji: string;
  demoText: string;
  demoPlace: string;
  descriptionKeyword: string;
}

const BASE_EVENTS: BaseEventTemplate[] = [
  {
    key: 'vesillya',
    nameAccusative: 'на весілля',
    nameNominative: 'Весілля',
    emoji: '💍',
    demoText: 'Кохані та дорогі друзі! Ми неймовірно раді запросити вас розділити з нами цей особливий та найщасливіший день нашого життя.',
    demoPlace: 'Заміський комплекс «Grand Hall»',
    descriptionKeyword: 'весільних запрошень'
  },
  {
    key: 'den-narodzhennya',
    nameAccusative: 'на день народження',
    nameNominative: 'День народження',
    emoji: '🎂',
    demoText: 'Привіт! Запрошую тебе на святкування мого дня народження! Буде весело, смачно та атмосферно. Чекаю на тебе!',
    demoPlace: 'Лофт-простір «Party Room»',
    descriptionKeyword: 'запрошень на день народження'
  },
  {
    key: 'pobachennya',
    nameAccusative: 'на побачення',
    nameNominative: 'Побачення',
    emoji: '🌹',
    demoText: 'Привіт! Пропоную провести цей вечір разом за смачною вечерею та цікавою розмовою. Давай зустрінемось?',
    demoPlace: 'Італійський ресторанчик «Prego»',
    descriptionKeyword: 'оригінальних запрошень на побачення'
  },
  {
    key: 'vechirku',
    nameAccusative: 'на вечірку',
    nameNominative: 'Вечірка',
    emoji: '🥂',
    demoText: 'Хей! Збираємось на круту вечірку! Крута музика, приємна компанія та відмінний настрій гарантовані. Приходь обов\'язково!',
    demoPlace: 'Арт-простір «Платформа»',
    descriptionKeyword: 'запрошень на паті та вечірки'
  },
  {
    key: 'kavu',
    nameAccusative: 'на каву',
    nameNominative: 'Кава',
    emoji: '☕',
    demoText: 'Привіт! Маю вільну годину та купу цікавих новин. Зустрінемось на філіжанку кави чи чаю сьогодні або на вихідних?',
    demoPlace: 'Kyiv Coffee, Хрещатик',
    descriptionKeyword: 'швидких запрошень на каву'
  },
  {
    key: 'zustrich',
    nameAccusative: 'на зустріч',
    nameNominative: 'Зустріч',
    emoji: '🤝',
    demoText: 'Вітаю! Пропоную провести зустріч для обговорення наших планів, обміну ідеями та просто приємної розмови.',
    demoPlace: 'Коворкінг «Beehive»',
    descriptionKeyword: 'запрошень на особисті зустрічі'
  },
  {
    key: 'yuviley',
    nameAccusative: 'на ювілей',
    nameNominative: 'Ювілей',
    emoji: '✨',
    demoText: 'Дорогі гості! Запрошую вас на урочисте святкування мого ювілею. Буду радий бачити кожного з вас!',
    demoPlace: 'Банкетний зал «Едем»',
    descriptionKeyword: 'запрошень на ювілей'
  },
  {
    key: 'hrestini',
    nameAccusative: 'на хрестини',
    nameNominative: 'Хрестини',
    emoji: '👼',
    demoText: 'Дорогі близькі! Запрошуємо вас розділити світлу радість таїнства хрещення нашої дитини.',
    demoPlace: 'Храм Святого Миколая',
    descriptionKeyword: 'запрошень на хрещення дитини'
  },
  {
    key: 'noviy-rik',
    nameAccusative: 'на Новий рік',
    nameNominative: 'Новий рік',
    emoji: '🎄',
    demoText: 'Зустрічаємо Новий рік разом! На вас чекає святкова ялинка, бенгальські вогні, шампанське та новорічне диво.',
    demoPlace: 'Котедж у лісі',
    descriptionKeyword: 'новорічних запрошень'
  },
  {
    key: 'korporativ',
    nameAccusative: 'на корпоратив',
    nameNominative: 'Корпоратив',
    emoji: '💼',
    demoText: 'Шановні колеги! Запрошуємо вас на наш святковий корпоративний вечір. Підіб\'ємо підсумки та відпочинемо разом!',
    demoPlace: 'Ресторан «Terrace»',
    descriptionKeyword: 'запрошень на корпоративні події'
  },
  {
    key: 'devischnik',
    nameAccusative: 'на дівич-вечір',
    nameNominative: 'Дівич-вечір',
    emoji: '💄',
    demoText: 'Дівчата! Мої останні дні холостяцького життя треба відсвяткувати незабутньо! Чекаю на вас на моєму дівич-вечорі.',
    demoPlace: 'SPA-комплекс або Караоке',
    descriptionKeyword: 'запрошень на дівич-вечір'
  },
  {
    key: 'malchishnik',
    nameAccusative: 'на парубоцьку вечірку',
    nameNominative: 'Парубоцька вечірка',
    emoji: '🍺',
    demoText: 'Брати! Збираю вас на свою парубоцьку вечірку. Відірвемося на повну перед моїм одруженням!',
    demoPlace: 'Спорт-бар «Офсайд»',
    descriptionKeyword: 'запрошень на парубоцьку вечірку'
  },
  {
    key: 'novosillya',
    nameAccusative: 'на новосілля',
    nameNominative: 'Новосілля',
    emoji: '🔑',
    demoText: 'Ми нарешті переїхали! Запрошуємо вас оглянути наше нове гніздечко, посмакувати піцою та відсвяткувати новосілля.',
    demoPlace: 'Наша нова квартира',
    descriptionKeyword: 'запрошень на новосілля'
  },
  {
    key: 'vipuskniy',
    nameAccusative: 'на випускний',
    nameNominative: 'Випускний',
    emoji: '🎓',
    demoText: 'Ура, ми це зробили! Запрошуємо викладачів, батьків та друзів на урочисту церемонію випуску та святковий бал.',
    demoPlace: 'Актова зала університету',
    descriptionKeyword: 'запрошень на випускний вечір'
  },
  {
    key: 'vecheryu',
    nameAccusative: 'на вечерю',
    nameNominative: 'Вечеря',
    emoji: '🍽️',
    demoText: 'Запрошую вас до себе в гості на домашню вечерю. Приготую фірмову страву, відкриємо пляшку вина та душевно поспілкуємось.',
    demoPlace: 'У мене вдома',
    descriptionKeyword: 'запрошень на обід чи вечерю'
  },
  {
    key: 'piknik',
    nameAccusative: 'на пікнік',
    nameNominative: 'Пікнік',
    emoji: '🧺',
    demoText: 'Погода просто чудова! Збираємось на пікнік у парку. Беріть пледи, гарний настрій та смаколики.',
    demoPlace: 'Ботанічний сад, центральна галявина',
    descriptionKeyword: 'запрошень на пікнік'
  },
  {
    key: 'shashliki',
    nameAccusative: 'на шашлики',
    nameNominative: 'Шашлики',
    emoji: '🔥',
    demoText: 'Сезон відкрито! Запрошуємо на шашлики та барбекю на свіжому повітрі. М\'ясо маринується, чекаємо тільки на вас!',
    demoPlace: 'Альтанки біля озера',
    descriptionKeyword: 'запрошень на шашлики та барбекю'
  },
  {
    key: 'kino',
    nameAccusative: 'в кіно',
    nameNominative: 'Кіно',
    emoji: '🎬',
    demoText: 'Вийшов крутий фільм, який обов\'язково треба подивитися на великому екрані. Пішли в кіно разом?',
    demoPlace: 'Кінотеатр «Multiplex»',
    descriptionKeyword: 'запрошень на перегляд фільмів'
  },
  {
    key: 'igri',
    nameAccusative: 'на настільні ігри',
    nameNominative: 'Настільні ігри',
    emoji: '🎮',
    demoText: 'Влаштовуємо вечір настілок! Будемо грати в Мафію, Монополію та інші цікаві ігри. Готуйте тактику!',
    demoPlace: 'Гейм-кафе «Play»',
    descriptionKeyword: 'запрошень на настільні ігри'
  },
  {
    key: 'sport',
    nameAccusative: 'на спорт',
    nameNominative: 'Спорт / Активність',
    emoji: '⚽',
    demoText: 'Збираємо команду для гри у футбол / баскетбол / теніс. Приєднуйся до нас, розімнемось та пограємо!',
    demoPlace: 'Спортивний майданчик',
    descriptionKeyword: 'запрошень на тренування та спорт'
  },
  {
    key: 'master-klas',
    nameAccusative: 'на майстер-клас',
    nameNominative: 'Майстер-клас',
    emoji: '🎨',
    demoText: 'Запрошуємо вас на захоплюючий творчий майстер-клас, де ви зможете створити власний шедевр та навчитися новому.',
    demoPlace: 'Арт-студія «Колорит»',
    descriptionKeyword: 'запрошень на майстер-класи'
  }
];

// Initialize and generate the full 60+ list programmatically
const generatedLandingPages: Record<string, LandingPageConfig> = {};

// Add general landing page as a base
generatedLandingPages['stvoriti-zaproshennya'] = {
  slug: 'stvoriti-zaproshennya',
  metaTitle: 'Безкоштовне створення запрошень онлайн | Запрошення ✦',
  metaDesc: 'Створюйте красиві онлайн-запрошення на будь-які події абсолютно безкоштовно. Швидко, зручно та українською мовою.',
  heroTitlePrefix: 'Безкоштовне\nстворення',
  heroTitleHighlight: 'запрошень онлайн',
  heroDesc: 'Створюйте красиві онлайн-запрошення з датою, часом і місцем. Отримуйте чіткі відповіді від гостей — без довгих переписок у чатах.',
  emoji: '✉️',
  eventType: 'Зустріч',
  demoText: 'Привіт! Створив це запрошення за допомогою зручного онлайн-конструктора. Запрошую тебе приєднатися до нашої зустрічі!',
  demoLabel: 'Подія',
  demoValue: 'Субота, 21 червня',
  demoPlace: 'Затишне кафе в центрі',
};

// Generate pages dynamically
BASE_EVENTS.forEach((event) => {
  // Variation 1: stvoriti-zaproshennya-na-[event]
  const slug1 = `stvoriti-zaproshennya-na-${event.key}`;
  generatedLandingPages[slug1] = {
    slug: slug1,
    metaTitle: `Створити запрошення ${event.nameAccusative} онлайн | Запрошення ✦`,
    metaDesc: `Безкоштовний конструктор ${event.descriptionKeyword}. Створіть красиве онлайн запрошення ${event.nameAccusative} за 1 хвилину та надішліть гостям.`,
    heroTitlePrefix: `Створити\nзапрошення`,
    heroTitleHighlight: `${event.nameAccusative} онлайн`,
    heroDesc: `Безкоштовний та зручний конструктор для швидкого створення запрошень ${event.nameAccusative}. Створіть власне запрошення та надішліть посиланням гостям.`,
    emoji: event.emoji,
    eventType: event.nameNominative,
    demoText: event.demoText,
    demoLabel: 'Дата',
    demoValue: 'Субота, 21 червня',
    demoPlace: event.demoPlace,
  };

  // Variation 2: zaproshennya-na-[event]
  const slug2 = `zaproshennya-na-${event.key}`;
  generatedLandingPages[slug2] = {
    slug: slug2,
    metaTitle: `Запрошення ${event.nameAccusative} онлайн безкоштовно | Запрошення ✦`,
    metaDesc: `Красиві онлайн запрошення ${event.nameAccusative}. Створіть персональні шаблони для гостей та отримуйте підтвердження в один клік.`,
    heroTitlePrefix: `Запрошення\n${event.nameAccusative}`,
    heroTitleHighlight: `онлайн безкоштовно`,
    heroDesc: `Створюйте персональні онлайн запрошення ${event.nameAccusative} для гостей. Отримуйте чіткі відповіді в реальному часі без зайвих турбот.`,
    emoji: event.emoji,
    eventType: event.nameNominative,
    demoText: event.demoText,
    demoLabel: 'Дата',
    demoValue: 'Субота, 21 червня',
    demoPlace: event.demoPlace,
  };

  // Variation 3: bezkoshtovne-zaproshennya-na-[event]
  const slug3 = `bezkoshtovne-zaproshennya-na-${event.key}`;
  generatedLandingPages[slug3] = {
    slug: slug3,
    metaTitle: `Безкоштовне запрошення ${event.nameAccusative} | Запрошення ✦`,
    metaDesc: `Шукаєте безкоштовне запрошення ${event.nameAccusative}? Створіть стильне інтерактивне запрошення за секунди без оплати та реклами.`,
    heroTitlePrefix: `Безкоштовне\nзапрошення`,
    heroTitleHighlight: `${event.nameAccusative}`,
    heroDesc: `Створюйте та надсилайте стильні інтерактивні запрошення ${event.nameAccusative} абсолютно безкоштовно. Миттєві сповіщення про відповіді гостей.`,
    emoji: event.emoji,
    eventType: event.nameNominative,
    demoText: event.demoText,
    demoLabel: 'Дата',
    demoValue: 'Субота, 21 червня',
    demoPlace: event.demoPlace,
  };
});

export const LANDING_PAGES = generatedLandingPages;
