export const healthTypes = {visit: 'Приём у ветеринара', vaccine: 'Вакцинация', parasite: 'Обработка от паразитов', medicine: 'Препарат / назначение', weight: 'Вес / измерение'};
export const eventTypes = {visit: 'Ветеринар', vaccine: 'Вакцинация', parasite: 'Обработка', food: 'Питание', medicine: 'Препарат', other: 'Другое'};
export function defaultAvatar(shape = 'cat') { return {shape, color: '#d9d6cf', pattern: 'plain', secondary: '#f1e8d6', eyes: '#315c4b', collar: '#bc6852'}; }
