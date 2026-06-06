import Dexie from 'dexie'

export const db = new Dexie('MiCocinaDB')

db.version(1).stores({
  profiles:      '++id, name',
  products:      '++id, profileId, name, barcode, status, expiryDate',
  shoppingItems: '++id, profileId, name, bought',
  recipes:       '++id, profileId, title, status, rating',
  meals:         '++id, profileId, date',
  mealPlans:     '++id, profileId, week',
})

db.version(2).stores({
  shoppingItems: '++id, profileId, name, bought, productId',
})

export default db
