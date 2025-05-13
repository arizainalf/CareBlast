import edge from 'edge.js'
import { formatDate, formatMonth } from '#helpers/luxon'

edge.global('formatDate', formatDate)
edge.global('formatMonth', formatMonth )
