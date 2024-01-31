import { ParameterizedContext } from "koa";

declare global {
  namespace Reflect {
    function getMetadata<T = any>(
      metadataKey: any,
      target: Object,
      propertyKey: string | symbol
    ): T;
    function getMetadata<T = any>(metadataKey: any, target: Object): T;
  }

  type Dict<T = any> = Record<string, T>;

  interface Ctx extends ParameterizedContext {
    params: Dict;
  }
}
