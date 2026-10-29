import { authHandlers } from './account'
import { cartHandlers } from './cart'
import { catalogHandlers } from './catalog'
import { controlHandlers } from './control'
import { orderHandlers } from './orders'
import { stockChangeHandler } from './stock'
import { socketHandler } from '../socket'

export const handlers = [
  ...authHandlers,
  ...catalogHandlers,
  ...cartHandlers,
  ...orderHandlers,
  ...controlHandlers,
  stockChangeHandler,
  socketHandler,
]
