
import { Client, Databases, ID, Query } from 'appwrite'

const client = new Client()
  .setEndpoint('https://sgp.cloud.appwrite.io/v1')
  .setProject('69a31567000163cd12f4')

export const databases = new Databases(client)
export const DB_ID = '69a315a400098983d4e1'
export const COLS = {
  patients: 'patients',
  appointments: 'appointments',
  banners: 'banners',
  clinic_info: 'clinic_info',
  flashcards: 'flashcards',
  admin_settings: 'admin_settings',
  notifications: 'notifications'
}
export { ID, Query }
