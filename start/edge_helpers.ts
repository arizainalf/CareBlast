import edge from 'edge.js'
import { formatDate, formatMonth, formatPhoneNumber, baseUrl, toDateInputValue } from '#helpers/luxon'

edge.global('formatDate', formatDate)
edge.global('formatMonth', formatMonth )
edge.global('formatPhoneNumber', formatPhoneNumber)
edge.global('baseUrl', baseUrl)
edge.global('toDateInputValue', toDateInputValue )
