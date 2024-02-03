import { Like } from "typeorm"

interface QueryRule {
  name: string;
  column?: string;
  op?: 'like',
  defaultVal?: string | number | boolean;
}

/**
 * Generate sql filter conditions.
 * @param ctx 
 * @param rules 
 * @returns 
 */
export function useWhere(ctx: Ctx, rules: QueryRule[]) {
  return rules.reduce((result, rule) => {
    const value = ctx.query[rule.name]
    if (value === undefined) {
      if (rule.defaultVal === undefined) {
        return result
      } else {
        result[rule.column || rule.name] = value
        return result
      }
    } else {
      switch (rule.op) {
        case undefined: {
          result[rule.column || rule.name] = value
          return result
        }
        case 'like': {
          result[rule.column || rule.name] = Like(`%${value}%`)
          return result
        }
      }
    }
  }, {} as Dict)
}

export function useOrWhere(ctx: Ctx, rules: QueryRule[][]) {
  return rules.reduce((result, rule) => {
    const where = useWhere(ctx, rule)
    if (Object.entries(where).length > 0) {
      result.push(where)
    }
    return result
  }, [] as Dict[])
}

/**
 * Handling paging parameters.
 * @param ctx 
 * @param next 
 */
export function usePagination(ctx: Ctx, defaultPage = 1, defaultSize = 20) {
  const all = ctx.query.all
  if (all === 'true') return { skip: undefined, take: undefined }
  const page = parseInt(ctx.query.page as string) || defaultPage
  const size = parseInt(ctx.query.size as string) || defaultSize
  return { skip: (page - 1) * size, take: size }
}
