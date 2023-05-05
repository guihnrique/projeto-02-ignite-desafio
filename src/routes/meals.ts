import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { randomUUID } from 'crypto'

export async function mealsRoutes(app: FastifyInstance) {
  // Create a new meal.
  app.post(
    '/create',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const createMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        is_on_diet: z.boolean(),
      })

      // eslint-disable-next-line camelcase
      const { name, description, is_on_diet } = createMealBodySchema.parse(
        request.body,
      )

      const sessionId = request.cookies.sessionId

      await knex('meals').insert({
        id: randomUUID(),
        name,
        description,
        // eslint-disable-next-line camelcase
        is_on_diet,
        user_id: sessionId,
      })

      return reply.status(201).send()
    },
  )

  // Get all meals from specific user.
  app.get(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const { sessionId } = request.cookies
      const meals = await knex('meals').where('user_id', sessionId).select()

      if (!meals.length) {
        return reply.status(404).send({
          error: 'This user has no meals or does not exist.',
        })
      }
      return {
        meals,
      }
    },
  )

  // Get specific meals from specific user.
  app.get(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getSpecificMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getSpecificMealParamsSchema.parse(request.params)
      const { sessionId } = request.cookies

      const meal = await knex('meals')
        .where({
          user_id: sessionId,
          id,
        })
        .first()

      if (!meal) {
        return reply.status(404).send({
          error: 'This user has no this specific meal or does not exist.',
        })
      }
      return {
        meal,
      }
    },
  )

  // Get specific meals from specific user.
  app.delete(
    '/delete/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getSpecificMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getSpecificMealParamsSchema.parse(request.params)
      const { sessionId } = request.cookies

      const deleteMeal = await knex('meals')
        .where({
          user_id: sessionId,
          id,
        })
        .first()
        .del()

      if (!deleteMeal) {
        return reply.status(404).send({
          error: 'This user has no this specific meal or does not exist.',
        })
      }

      return reply.status(201).send()
    },
  )
}
