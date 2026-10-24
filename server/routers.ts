import {
  getSessionCookieName,
  getSessionCookieOptions,
} from "./_core/cookies";
import { generateImage } from "./_core/imageGeneration";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(getSessionCookieName(ctx.req), {
        ...cookieOptions,
        maxAge: -1,
      });
      return { success: true } as const;
    }),
  }),
  art: router({
    generate: publicProcedure
      .input(z.object({ prompt: z.string().trim().min(3).max(1000) }))
      .mutation(async ({ input }) => {
        try {
          return await generateImage({ prompt: input.prompt });
        } catch (error) {
          console.error("[art.generate] Image generation failed", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "No se pudo generar la imagen. Revisa tu conexión e inténtalo de nuevo.",
          });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
