import { QueryState } from '@matheuspuel/query-state'
import { DateTime, Effect, Either } from 'effect'
import { describe, expect, it } from 'vitest'

describe('QueryState', () => {
  describe('constructor and make', () => {
    it('creates a QueryState with all properties null', () => {
      const state = new QueryState({
        loading: null,
        success: null,
        failure: null,
      })
      expect(state.loading).toBeNull()
      expect(state.success).toBeNull()
      expect(state.failure).toBeNull()
    })

    it('creates a QueryState with static make method', () => {
      const state = QueryState.make({
        loading: null,
        success: { data: 42 },
        failure: null,
      })
      expect(state.success?.data).toBe(42)
    })
  })

  describe('property getters', () => {
    it('isLoading returns true when loading is present', () => {
      const state = QueryState.started()
      expect(state.isLoading).toBe(true)
    })

    it('isLoading returns false when loading is null', () => {
      const state = QueryState.initial()
      expect(state.isLoading).toBe(false)
    })

    it('progress returns the progress value when loading', () => {
      const state = QueryState.started({ progress: 0.5 })
      expect(state.progress).toBe(0.5)
    })

    it('progress returns null when not loading', () => {
      const state = QueryState.initial()
      expect(state.progress).toBeNull()
    })

    it('data returns the data value when succeeded', () => {
      const state = QueryState.succeeded({ data: { count: 10 } })
      expect(state.data).toEqual({ count: 10 })
    })

    it('data returns null when not succeeded', () => {
      const state = QueryState.initial()
      expect(state.data).toBeNull()
    })

    it('error returns the error value when failed', () => {
      const state = QueryState.failed({ error: 'NetworkError' })
      expect(state.error).toBe('NetworkError')
    })

    it('error returns null when not failed', () => {
      const state = QueryState.initial()
      expect(state.error).toBeNull()
    })
  })

  describe('initial', () => {
    it('creates an empty QueryState', () => {
      const state = QueryState.initial<number, string>()
      expect(state.loading).toBeNull()
      expect(state.success).toBeNull()
      expect(state.failure).toBeNull()
    })

    it('can be called multiple times and returns equal instances', () => {
      expect(QueryState.initial()).toStrictEqual(QueryState.initial())
    })
  })

  describe('started', () => {
    it('creates a loading QueryState without progress', () => {
      const state = QueryState.started()
      expect(state.loading).not.toBeNull()
      expect(state.progress).toBeUndefined()
      expect(state.success).toBeNull()
      expect(state.failure).toBeNull()
    })

    it('creates a loading QueryState with progress', () => {
      const state = QueryState.started({ progress: 0.5 })
      expect(state.loading).not.toBeNull()
      expect(state.progress).toBe(0.5)
    })

    it('can include a time', () => {
      const time = DateTime.unsafeMake('2026-01-01T00:00:00Z')
      const state = QueryState.started({ time, progress: 0.5 })
      expect(state.loading?.time).toBe(time)
    })

    it('returns equal instances when called with same arguments', () => {
      expect(QueryState.started()).toStrictEqual(QueryState.started())
      expect(QueryState.started({ progress: 0.5 })).toStrictEqual(
        QueryState.started({ progress: 0.5 }),
      )
    })
  })

  describe('succeeded', () => {
    it('creates a successful QueryState', () => {
      const state = QueryState.succeeded({ data: 42 })
      expect(state.success?.data).toBe(42)
      expect(state.loading).toBeNull()
      expect(state.failure).toBeNull()
    })

    it('can include a time', () => {
      const time = DateTime.unsafeMake('2026-01-01T00:00:00Z')
      const state = QueryState.succeeded({ data: 42, time })
      expect(state.success?.time).toBe(time)
    })
  })

  describe('failed', () => {
    it('creates a failed QueryState', () => {
      const state = QueryState.failed({ error: 'NetworkError' })
      expect(state.failure?.error).toBe('NetworkError')
      expect(state.loading).toBeNull()
      expect(state.success).toBeNull()
    })

    it('can include a time', () => {
      const time = DateTime.unsafeMake('2026-01-01T00:00:00Z')
      const state = QueryState.failed({ error: 'Error', time })
      expect(state.failure?.time).toBe(time)
    })
  })

  describe('start (static and instance)', () => {
    it('sets loading state preserving success and failure', () => {
      const initial = QueryState.make({
        loading: null,
        success: { data: 42 },
        failure: { error: 'OldError' },
      })
      const updated = QueryState.start()(initial)
      expect(updated.loading).not.toBeNull()
      expect(updated.success?.data).toBe(42)
      expect(updated.failure?.error).toBe('OldError')
    })

    it('updates progress while preserving data and error', () => {
      const initial = QueryState.make({
        loading: { progress: 0.5 },
        success: { data: 42 },
        failure: { error: 'OldError' },
      })
      const updated = QueryState.start({ progress: 0.8 })(initial)
      expect(updated.progress).toBe(0.8)
      expect(updated.success?.data).toBe(42)
    })

    it('works as instance method', () => {
      const initial = QueryState.succeeded({ data: 42 })
      const updated = initial.start()
      expect(updated.isLoading).toBe(true)
      expect(updated.data).toBe(42)
    })

    it('works as instance method with progress', () => {
      const initial = QueryState.initial<number, string, number>()
      const updated = initial.start({ progress: 0.5 })
      expect(updated.progress).toBe(0.5)
    })
  })

  describe('succeed (static and instance)', () => {
    it('sets success state clearing loading and failure', () => {
      const initial = QueryState.make({
        loading: { progress: undefined },
        success: null,
        failure: { error: 'Error' },
      })
      const updated = QueryState.succeed({ data: 42 })(initial)
      expect(updated.success?.data).toBe(42)
      expect(updated.loading).toBeNull()
      expect(updated.failure).toBeNull()
    })

    it('works as instance method', () => {
      const initial = QueryState.started<number>()
      const updated = initial.succeed({ data: 42 })
      expect(updated.data).toBe(42)
      expect(updated.isLoading).toBe(false)
    })

    it('can include a time', () => {
      const time = DateTime.unsafeMake('2026-01-01T00:00:00Z')
      const initial = QueryState.started<number>()
      const updated = initial.succeed({ data: 42, time })
      expect(updated.success?.time).toBe(time)
    })
  })

  describe('fail (static and instance)', () => {
    it('sets failure state while preserving success', () => {
      const initial = QueryState.make({
        loading: { progress: undefined },
        success: { data: 42 },
        failure: null,
      })
      const updated = QueryState.fail({ error: 'NetworkError' })(initial)
      expect(updated.failure?.error).toBe('NetworkError')
      expect(updated.success?.data).toBe(42)
      expect(updated.loading).toBeNull()
    })

    it('works as instance method', () => {
      const initial = QueryState.succeeded({ data: 42 })
      const updated = initial.fail({ error: 'NetworkError' })
      expect(updated.error).toBe('NetworkError')
      expect(updated.data).toBe(42)
    })

    it('can include a time', () => {
      const time = DateTime.unsafeMake('2026-01-01T00:00:00Z')
      const initial = QueryState.succeeded({ data: 42 })
      const updated = initial.fail({ error: 'Error', time })
      expect(updated.failure?.time).toBe(time)
    })
  })

  describe('setFailure (static and instance)', () => {
    it('sets failure state explicitly while preserving loading and success', () => {
      const initial = QueryState.make({
        loading: { progress: 0.5 },
        success: { data: 42 },
        failure: null,
      })
      const updated = QueryState.setFailure({ error: 'Error' })(initial)
      expect(updated.failure?.error).toBe('Error')
      expect(updated.loading?.progress).toBe(0.5)
      expect(updated.success?.data).toBe(42)
    })

    it('can clear failure by passing null', () => {
      const initial = QueryState.failed({ error: 'Error' })
      const updated = QueryState.setFailure(null)(initial)
      expect(updated.failure).toBeNull()
    })

    it('works as instance method', () => {
      const initial = QueryState.succeeded({ data: 42 })
      const updated = initial.setFailure({ error: 'Error' })
      expect(updated.error).toBe('Error')
      expect(updated.data).toBe(42)
    })
  })

  describe('applyEither (static and instance)', () => {
    it('applies Right result to set success', () => {
      const initial = QueryState.started()
      const either = Either.right(42)
      const updated = QueryState.applyEither(either)(initial)
      expect(updated.data).toBe(42)
      expect(updated.isLoading).toBe(false)
    })

    it('applies Left result to set failure', () => {
      const initial = QueryState.started()
      const either = Either.left('NetworkError')
      const updated = QueryState.applyEither(either)(initial)
      expect(updated.error).toBe('NetworkError')
      expect(updated.isLoading).toBe(false)
    })

    it('preserves success when applying a new error', () => {
      const initial = QueryState.succeeded({ data: 42 })
      const either = Either.left('Error')
      const updated = QueryState.applyEither(either)(initial)
      expect(updated.error).toBe('Error')
      expect(updated.data).toBe(42)
    })

    it('works as instance method', () => {
      const initial = QueryState.started<number>()
      const either = Either.right(42)
      const updated = initial.applyEither(either)
      expect(updated.data).toBe(42)
    })

    it('can include a time', () => {
      const time = DateTime.unsafeMake('2026-01-01T00:00:00Z')
      const initial = QueryState.started<number>()
      const either = Either.right(42)
      const updated = initial.applyEither(either, { time })
      expect(updated.success?.time).toBe(time)
    })
  })

  describe('map (static and instance)', () => {
    it('transforms success data when present', () => {
      const initial = QueryState.succeeded({ data: 42 })
      const updated = QueryState.map((x: number) => x * 2)(initial)
      expect(updated.data).toBe(84)
    })

    it('does nothing when success is null', () => {
      const initial = QueryState.failed({ error: 'Error' })
      const updated = QueryState.map((x: unknown) => x)(initial)
      expect(updated.data).toBeNull()
      expect(updated.error).toBe('Error')
    })

    it('works as instance method', () => {
      const initial = QueryState.succeeded({ data: 42 })
      const updated = initial.map((x: number) => x * 2)
      expect(updated.data).toBe(84)
    })

    it('can chain multiple maps', () => {
      const initial = QueryState.succeeded({ data: 10 })
      const updated = initial
        .map((x: number) => x * 2)
        .map((x: number) => x + 5)
      expect(updated.data).toBe(25)
    })
  })

  describe('makeProgress (static and instance)', () => {
    it('updates progress in loading state', () => {
      const initial = QueryState.started({ progress: 0.5 })
      const updated = QueryState.makeProgress(0.8)(initial)
      expect(updated.progress).toBe(0.8)
    })

    it('sets progress if not loading', () => {
      const initial = QueryState.initial<number, string, number>()
      const updated = QueryState.makeProgress(0.5)(initial)
      expect(updated.progress).toBe(0.5)
    })

    it('preserves loading time', () => {
      const time = DateTime.unsafeMake('2026-01-01T00:00:00Z')
      const initial = QueryState.started({ time, progress: 0.5 })
      const updated = QueryState.makeProgress(0.8)(initial)
      expect(updated.loading?.time).toBe(time)
      expect(updated.progress).toBe(0.8)
    })

    it('works as instance method', () => {
      const initial = QueryState.started({ progress: 0.5 })
      const updated = initial.makeProgress(0.8)
      expect(updated.progress).toBe(0.8)
    })

    it('can use string progress', () => {
      const initial = QueryState.initial<number, string, string>()
      const updated = QueryState.makeProgress('validating')(initial)
      expect(updated.progress).toBe('validating')
    })
  })

  describe('invalidate (static and instance)', () => {
    it('clears success state while preserving loading and failure', () => {
      const initial = QueryState.make({
        loading: { progress: undefined },
        success: { data: 42 },
        failure: { error: 'Error' },
      })
      const updated = QueryState.invalidate(initial)
      expect(updated.success).toBeNull()
      expect(updated.loading).not.toBeNull()
      expect(updated.failure).not.toBeNull()
    })

    it('works as instance method', () => {
      const initial = QueryState.succeeded({ data: 42 })
      const updated = initial.invalidate()
      expect(updated.success).toBeNull()
    })

    it('does nothing when success is already null', () => {
      const initial = QueryState.started()
      const updated = initial.invalidate()
      expect(updated).toStrictEqual(initial)
    })
  })

  describe('trackEffect', () => {
    it('updates state on effect start and success', async () => {
      const history: Array<QueryState<number, string, undefined>> = []
      const updateQueryState = (
        f: (
          state: QueryState<number, string, undefined>,
        ) => QueryState<number, string, undefined>,
      ) => {
        const newState = f(history[history.length - 1] || QueryState.initial())
        history.push(newState)
      }

      const effect = Effect.succeed(42)
      const tracked = QueryState.trackEffect(updateQueryState, effect)

      const result = await Effect.runPromise(tracked(undefined))

      expect(result).toBe(42)
      expect(history.length).toBeGreaterThanOrEqual(2)
      const lastState = history[history.length - 1]
      if (!lastState) throw new Error('No states were recorded')
      expect(lastState.data).toBe(42)
      expect(lastState.isLoading).toBe(false)
    })

    it('updates state on effect start and failure', async () => {
      const history: Array<QueryState<number, string, undefined>> = []
      const updateQueryState = (
        f: (
          state: QueryState<number, string, undefined>,
        ) => QueryState<number, string, undefined>,
      ) => {
        const newState = f(history[history.length - 1] || QueryState.initial())
        history.push(newState)
      }

      const effect = Effect.fail('NetworkError')
      const tracked = QueryState.trackEffect(updateQueryState, effect)

      try {
        await Effect.runPromise(tracked(undefined))
      } catch {
        // Expected to fail
      }

      const lastState = history[history.length - 1]
      if (!lastState) throw new Error('No states were recorded')
      expect(lastState.error).toBe('NetworkError')
      expect(lastState.isLoading).toBe(false)
    })

    it('works with initial progress', async () => {
      const history: Array<QueryState<number, string, string>> = []
      const updateQueryState = (
        f: (
          state: QueryState<number, string, string>,
        ) => QueryState<number, string, string>,
      ) => {
        const newState = f(history[history.length - 1] || QueryState.initial())
        history.push(newState)
      }

      const effect = Effect.succeed(42)
      const tracked = QueryState.trackEffect(updateQueryState, effect, {
        initialProgress: 'loading',
      })

      await Effect.runPromise(tracked(undefined))

      const firstLoadingState = history.find(
        s => s.isLoading && s.progress === 'loading',
      )
      expect(firstLoadingState).toBeDefined()
    })

    it('handles function effects that receive input and updateQueryState', async () => {
      const history: Array<QueryState<number, string, string>> = []
      const updateQueryState = (
        f: (
          state: QueryState<number, string, string>,
        ) => QueryState<number, string, string>,
      ) => {
        const newState = f(history[history.length - 1] || QueryState.initial())
        history.push(newState)
      }

      const effect = (
        input: number,
        update: (
          f: (
            state: QueryState<number, string, string>,
          ) => QueryState<number, string, string>,
        ) => void,
      ) => {
        update(s => s.makeProgress('processing'))
        return Effect.succeed(input * 2)
      }

      const tracked = QueryState.trackEffect(updateQueryState, effect, {
        initialProgress: 'starting',
      })

      const result = await Effect.runPromise(tracked(21))

      expect(result).toBe(42)
      expect(history.some(s => s.progress === 'processing')).toBe(true)
      const lastState = history[history.length - 1]
      if (!lastState) throw new Error('No states were recorded')
      expect(lastState.data).toBe(42)
    })
  })

  describe('equality', () => {
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
})
