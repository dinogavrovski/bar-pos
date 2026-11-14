import { pgEnum } from 'drizzle-orm/pg-core'

export const userRoles = pgEnum('user_role', ['admin', 'normal'])

export const stationType = pgEnum('station_type', ['bar', 'kitchen'])
