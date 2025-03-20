import {
  FastifyBaseLogger,
  FastifyPluginCallback,
  FastifyPluginOptions,
  FastifyTypeProvider,
  RawServerBase,
} from "fastify";

type CustomFastifyPlugin = FastifyPluginCallback<
  FastifyPluginOptions,
  RawServerBase,
  FastifyTypeProvider,
  FastifyBaseLogger
>;

const fastifyRequestParserPlugin: CustomFastifyPlugin = function (
  instance,
  options,
  next,
) {
  instance.addContentTypeParser("application/json", (req, body, done) => {
    try {
      const parsedBody = JSON.parse(body.toString());
      done(null, parsedBody);
    } catch (error) {
      done(error, undefined);
    }
  });

  next();
};

export default fastifyRequestParserPlugin;
