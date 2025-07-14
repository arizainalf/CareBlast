import edge from 'edge.js'
import { formatDate, formatMonth, formatPhoneNumber, baseUrl, toDateInputValue, getPengaturan } from '#helpers/luxon'

edge.global('formatDate', formatDate)
edge.global('formatMonth', formatMonth)
edge.global('formatPhoneNumber', formatPhoneNumber)
edge.global('baseUrl', baseUrl)
edge.global('toDateInputValue', toDateInputValue)
edge.global('getPengaturan', getPengaturan)
