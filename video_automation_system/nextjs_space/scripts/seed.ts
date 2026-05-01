import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const sampleScripts = [
  {
    platform: 'youtube_shorts',
    title: '5 привычек миллионеров, которые изменят твою жизнь',
    hook: 'Ты знаешь, что общего у всех миллионеров? Эти 5 привычек делают их богатыми...',
    contentType: 'listicle',
    emotion: 'inspiring',
    status: 'ready',
    fullScript: {
      scenes: [
        { sceneNumber: 1, duration: '0-8s', text: 'Ты знаешь, что общего у всех миллионеров? Эти 5 привычек отделяют бедных от богатых.', visualDescription: 'Динамичный монтаж дорогих часов, костюмов, спорткаров. Тёмный фон с золотыми акцентами.', cameraAngle: 'Крупный план, быстрая смена ракурсов', musicMood: 'Энергичная, мотивационная', transition: 'Быстрый зум' },
        { sceneNumber: 2, duration: '8-20s', text: 'Привычка номер 1: Они встают в 5 утра. Привычка номер 2: 30 минут чтения каждый день.', visualDescription: 'Будильник на 5:00, человек читает книгу в кресле. Минималистичный декор.', cameraAngle: 'Средний план', musicMood: 'Спокойная, уверенная', transition: 'Плавный переход' },
        { sceneNumber: 3, duration: '20-35s', text: 'Привычка 3: Инвестируют 20% дохода. Привычка 4: Нетворкинг — окружение решает всё.', visualDescription: 'Графики роста инвестиций, деловая встреча в кафе, рукопожатие.', cameraAngle: 'Динамичная съёмка', musicMood: 'Нарастающая', transition: 'Свайп вправо' },
        { sceneNumber: 4, duration: '35-50s', text: 'Привычка 5: Они НИКОГДА не перестают учиться. Каждый день — новый навык, новый уровень.', visualDescription: 'Человек за ноутбуком, онлайн-курсы, записи в блокноте.', cameraAngle: 'Крупный план рук, затем лицо', musicMood: 'Кульминация', transition: 'Зум на текст' },
        { sceneNumber: 5, duration: '50-60s', text: 'Какую привычку ты начнёшь сегодня? Подпишись и поставь лайк, если хочешь больше такого контента!', visualDescription: 'Текст на экране с CTA, кнопки подписки, лайка. Яркие цвета.', cameraAngle: 'Полноэкранный текст', musicMood: 'Финальный аккорд', transition: 'Fade out' },
      ],
      totalDuration: '60s',
      style: 'Мотивационный, энергичный',
      targetAudience: 'Молодые предприниматели 18-35',
      hashtags: ['миллионер', 'привычки', 'успех', 'мотивация', 'деньги'],
    },
  },
  {
    platform: 'tiktok',
    title: 'Психологический трюк, который заставит людей слушать тебя',
    hook: 'Этот психологический трюк используют лучшие ораторы мира...',
    contentType: 'fact_revelation',
    emotion: 'curious',
    status: 'draft',
    fullScript: {
      scenes: [
        { sceneNumber: 1, duration: '0-7s', text: 'Этот психологический трюк используют лучшие ораторы мира. И ты можешь начать прямо сейчас.', visualDescription: 'Силуэт человека на сцене, софиты, аудитория в темноте.', cameraAngle: 'Широкий план с зумом', musicMood: 'Таинственная', transition: 'Быстрый cut' },
        { sceneNumber: 2, duration: '7-20s', text: 'Когда ты говоришь — делай паузу после ключевой фразы. Мозг собеседника автоматически начинает обрабатывать информацию.', visualDescription: 'Визуализация нейронных связей в мозге, эффект замедления времени.', cameraAngle: 'Анимация крупным планом', musicMood: 'Научная, интригующая', transition: 'Замедление' },
        { sceneNumber: 3, duration: '20-35s', text: 'Исследования Гарварда показали: пауза в 2-3 секунды повышает запоминаемость речи на 40%.', visualDescription: 'Текст статистики, логотип Гарварда, графики.', cameraAngle: 'Инфографика на экране', musicMood: 'Уверенная', transition: 'Свайп вверх' },
        { sceneNumber: 4, duration: '35-48s', text: 'Но есть нюанс: пауза работает только если ты смотришь собеседнику в глаза. Контакт глаз + пауза = абсолютная власть в разговоре.', visualDescription: 'Два человека разговаривают, крупный план глаз, уверенный взгляд.', cameraAngle: 'Крупный план лица', musicMood: 'Нарастающая', transition: 'Плавный переход' },
        { sceneNumber: 5, duration: '48-58s', text: 'Попробуй сегодня и напиши в комментариях, что изменилось. Подпишись за больше психологических хаков!', visualDescription: 'CTA текст, анимация кнопки подписки, яркий фон.', cameraAngle: 'Полноэкранный текст', musicMood: 'Позитивная', transition: 'Fade out' },
      ],
      totalDuration: '58s',
      style: 'Научно-популярный, интригующий',
      targetAudience: 'Все 16-45, интересуются саморазвитием',
      hashtags: ['психология', 'ораторское', 'лайфхак', 'общение', 'мозг'],
    },
  },
  {
    platform: 'youtube_shorts',
    title: 'Как Илон Маск управляет временем',
    hook: 'Илон Маск работает по 100 часов в неделю. Вот его секрет...',
    contentType: 'story_hook',
    emotion: 'inspiring',
    status: 'published',
    fullScript: {
      scenes: [
        { sceneNumber: 1, duration: '0-10s', text: 'Илон Маск работает 100 часов в неделю на 3 компании. Его секрет — метод тайм-боксинга.', visualDescription: 'Фото Илона Маска, часы, календарь с блоками задач.', cameraAngle: 'Средний план', musicMood: 'Эпическая', transition: 'Зум' },
        { sceneNumber: 2, duration: '10-25s', text: 'Он делит каждый день на 5-минутные блоки. Каждый блок — конкретная задача. Никаких отвлечений.', visualDescription: 'Анимация календаря с цветными блоками, таймер.', cameraAngle: 'Скринкаст стиль', musicMood: 'Деловая', transition: 'Свайп' },
        { sceneNumber: 3, duration: '25-40s', text: 'Понедельник и четверг — SpaceX. Вторник, среда и пятница — Tesla. Выходные — семья и отдых.', visualDescription: 'Ракета SpaceX, завод Tesla, семейный ужин.', cameraAngle: 'Быстрая смена кадров', musicMood: 'Энергичная', transition: 'Быстрый cut' },
        { sceneNumber: 4, duration: '40-50s', text: 'Но самое важное: он ВСЕГДА оставляет время на обдумывание. 30 минут в день — просто думать.', visualDescription: 'Человек смотрит в окно, закат, тишина.', cameraAngle: 'Крупный план', musicMood: 'Медитативная', transition: 'Замедление' },
        { sceneNumber: 5, duration: '50-60s', text: 'Попробуй тайм-боксинг завтра. Сохрани это видео и поделись с другом, которому не хватает времени!', visualDescription: 'CTA экран, кнопки, финальный слоган.', cameraAngle: 'Текст на экране', musicMood: 'Позитивная', transition: 'Fade out' },
      ],
      totalDuration: '60s',
      style: 'История успеха, мотивационный',
      targetAudience: 'Предприниматели и менеджеры 20-40',
      hashtags: ['ИлонМаск', 'таймменеджмент', 'продуктивность', 'успех'],
    },
  },
  {
    platform: 'tiktok',
    title: '3 упражнения, которые сожгут жир за 10 минут',
    hook: 'Забудь про часовые тренировки. Эти 3 упражнения сожгут больше калорий...',
    contentType: 'tutorial',
    emotion: 'energetic',
    status: 'ready',
    fullScript: {
      scenes: [
        { sceneNumber: 1, duration: '0-8s', text: 'Забудь про часовые тренировки. Эти 3 упражнения за 10 минут сожгут больше жира, чем час на беговой дорожке.', visualDescription: 'Человек перечёркивает беговую дорожку, показывает секундомер на 10 минут.', cameraAngle: 'Динамичный средний план', musicMood: 'Энергичная, бит', transition: 'Быстрый зум' },
        { sceneNumber: 2, duration: '8-22s', text: 'Упражнение 1: Бёрпи — 3 подхода по 10 раз. Активирует всё тело, сжигает 150 калорий за подход.', visualDescription: 'Демонстрация бёрпи с правильной техникой, счётчик калорий.', cameraAngle: 'Широкий план, затем детали', musicMood: 'Бит нарастает', transition: 'Свайп' },
        { sceneNumber: 3, duration: '22-37s', text: 'Упражнение 2: Скалолаз — 3 подхода по 20 раз. Пресс + кардио = двойной удар.', visualDescription: 'Демонстрация упражнения "скалолаз", акцент на мышцы пресса.', cameraAngle: 'Крупный план корпуса', musicMood: 'Интенсивная', transition: 'Cut' },
        { sceneNumber: 4, duration: '37-50s', text: 'Упражнение 3: Прыжки со сквотом — 3 подхода по 15 раз. Максимальная нагрузка на ноги и ягодицы.', visualDescription: 'Прыжки со сквотом, замедленная съёмка прыжка.', cameraAngle: 'Нижний ракурс', musicMood: 'Кульминация', transition: 'Замедление и ускорение' },
        { sceneNumber: 5, duration: '50-60s', text: 'Делай это каждый день и через месяц не узнаешь себя. Сохраняй и начинай сегодня!', visualDescription: 'До/После трансформация, кнопка сохранения.', cameraAngle: 'Сплит-экран', musicMood: 'Финальный бит', transition: 'Fade out' },
      ],
      totalDuration: '60s',
      style: 'Фитнес-туториал, энергичный',
      targetAudience: 'Женщины и мужчины 18-35, хотят похудеть',
      hashtags: ['фитнес', 'похудение', 'тренировка', 'жиросжигание', 'дома'],
    },
  },
  {
    platform: 'youtube_shorts',
    title: 'Факт о мозге, который тебя шокирует',
    hook: 'Твой мозг потребляет 20% всей энергии тела. Но это не самое удивительное...',
    contentType: 'fact_revelation',
    emotion: 'surprised',
    status: 'draft',
    fullScript: {
      scenes: [
        { sceneNumber: 1, duration: '0-8s', text: 'Твой мозг весит всего 1.4 кг, но потребляет 20% всей энергии тела. Но это далеко не самое удивительное...', visualDescription: '3D модель мозга, визуализация энергии, цифры.', cameraAngle: 'Анимация с вращением', musicMood: 'Научная, загадочная', transition: 'Зум в мозг' },
        { sceneNumber: 2, duration: '8-22s', text: 'Мозг генерирует достаточно электричества, чтобы зажечь лампочку. 23 ватта — прямо сейчас в твоей голове.', visualDescription: 'Лампочка загорается от мозга, электрические импульсы.', cameraAngle: 'Крупный план', musicMood: 'Интригующая', transition: 'Вспышка' },
        { sceneNumber: 3, duration: '22-37s', text: 'Но вот что шокирует: мозг может хранить 2.5 петабайт информации. Это как 3 миллиона часов видео на YouTube.', visualDescription: 'Визуализация данных, сервер YouTube, число 2.5 петабайт.', cameraAngle: 'Инфографика', musicMood: 'Нарастающая', transition: 'Масштабирование' },
        { sceneNumber: 4, duration: '37-50s', text: 'И самое невероятное: мозг перестраивает себя каждую ночь. Во сне он удаляет ненужные связи и укрепляет важные.', visualDescription: 'Нейронные связи разрываются и формируются, ночное небо.', cameraAngle: 'Микроскопическая анимация', musicMood: 'Медитативная', transition: 'Плавный переход' },
        { sceneNumber: 5, duration: '50-60s', text: 'Поэтому сон так важен. Какой факт удивил тебя больше всего? Напиши в комментариях!', visualDescription: 'Вопрос на экране, CTA, подписка.', cameraAngle: 'Текст', musicMood: 'Финальная', transition: 'Fade out' },
      ],
      totalDuration: '60s',
      style: 'Научно-популярный, удивляющий',
      targetAudience: 'Все 14-45, любознательные',
      hashtags: ['мозг', 'факты', 'наука', 'удивительно', 'нейронауки'],
    },
  },
]

async function main() {
  console.log('Seeding database...')

  // Upsert test user
  const passwordHash = await bcrypt.hash('johndoe123', 12)
  const user = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      passwordHash,
      name: 'Admin User',
    },
  })

  // Upsert settings
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      platforms: JSON.stringify(['youtube_shorts', 'tiktok']),
      niche: 'motivation',
      language: 'russian',
      videosPerDay: 5,
      autopilotEnabled: true,
      scheduleTime: '09:00',
      contentStrategy: 'mixed',
      monetizationSettings: { affiliateLinks: '', cta: 'Подписывайся и ставь лайк!' },
    },
  })

  // Upsert scripts
  for (let i = 0; i < sampleScripts.length; i++) {
    const s = sampleScripts[i]
    const createdAt = new Date()
    createdAt.setDate(createdAt.getDate() - (sampleScripts.length - i))
    await prisma.videoScript.upsert({
      where: { id: `seed-script-${i + 1}` },
      update: {},
      create: {
        id: `seed-script-${i + 1}`,
        userId: user.id,
        platform: s.platform,
        title: s.title,
        hook: s.hook,
        contentType: s.contentType,
        emotion: s.emotion,
        status: s.status,
        fullScript: s.fullScript as any,
        createdAt,
      },
    })
  }

  // Upsert some trends
  const trends = [
    { id: 'trend-1', platform: 'tiktok', title: 'Storytime hooks', hookType: 'story_hook', emotion: 'curious', views: 1500000, engagementRate: 8.5 },
    { id: 'trend-2', platform: 'youtube_shorts', title: 'Motivational monologues', hookType: 'motivational_monologue', emotion: 'inspiring', views: 2300000, engagementRate: 12.1 },
    { id: 'trend-3', platform: 'tiktok', title: 'Fact revelations', hookType: 'fact_revelation', emotion: 'surprised', views: 980000, engagementRate: 6.7 },
  ]
  for (const t of trends) {
    await prisma.trend.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    })
  }

  console.log('Seed complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
