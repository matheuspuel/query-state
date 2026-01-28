import { QueryState } from '@matheuspuel/query-state'
import { DateTime } from 'effect/index'
import { describe, expect, it } from 'vitest'

describe('QueryState', () => {
  it('can make test comparison', () => {
    const constant = QueryState.initial()
    expect(constant).toStrictEqual(constant)
    expect(QueryState.initial()).toStrictEqual(QueryState.initial())
    expect(QueryState.initial()).not.toStrictEqual(QueryState.started())
    expect(QueryState.started()).toStrictEqual(QueryState.started())
    expect(
      QueryState.make({ loading: null, failure: null, success: null }),
    ).toStrictEqual(
      QueryState.make({ loading: null, failure: null, success: null }),
    )
    expect(
      QueryState.succeeded({ data: 1, time: DateTime.unsafeMake(0) }),
    ).toStrictEqual(
      QueryState.succeeded({ data: 1, time: DateTime.unsafeMake(0) }),
    )
    expect(
      QueryState.succeeded({ data: 1, time: DateTime.unsafeMake(0) }),
    ).not.toStrictEqual(
      QueryState.succeeded({ data: 2, time: DateTime.unsafeMake(0) }),
    )
    expect(
      QueryState.succeeded({ data: 1, time: DateTime.unsafeMake(0) }),
    ).not.toStrictEqual(
      QueryState.succeeded({ data: 1, time: DateTime.unsafeMake(1) }),
    )
    expect(
      QueryState.make({
        loading: { progress: undefined },
        failure: { error: 'e', time: DateTime.unsafeMake(0) },
        success: { data: 1, time: DateTime.unsafeMake(0) },
      }),
    ).toStrictEqual(
      QueryState.make({
        loading: { progress: undefined },
        failure: { error: 'e', time: DateTime.unsafeMake(0) },
        success: { data: 1, time: DateTime.unsafeMake(0) },
      }),
    )
  })
})
