import { DateTime, Effect, Either, Pipeable } from 'effect'

/** Type helpers for extracting parts of a QueryState instance. */
export declare namespace QueryState {
  /** Extracts the loading progress type from a QueryState. */
  export type Progress<Q extends QueryState<unknown, unknown, unknown>> =
    NonNullable<Q['loading']>['progress']

  /** Extracts the success data type from a QueryState. */
  export type Data<Q extends QueryState<unknown, unknown, unknown>> =
    NonNullable<Q['success']>['data']

  /** Extracts the failure error type from a QueryState. */
  export type Error<Q extends QueryState<unknown, unknown, unknown>> =
    NonNullable<Q['failure']>['error']
}

/**
 * Immutable query state container with loading, success, and failure states.
 */
export class QueryState<A, E, P = undefined> extends Pipeable.Class() {
  /** Current loading state. */
  loading: { time?: DateTime.Utc | undefined; progress: P } | null
  /** Last still valid, successful result. */
  success: { time?: DateTime.Utc | undefined; data: A } | null
  /** Last still applicable failure. */
  failure: { time?: DateTime.Utc | undefined; error: E } | null

  /** Whether the operation is currently in progress. */
  get isLoading(): boolean {
    return !!this.loading
  }

  /** Current progress value if loading, otherwise null. */
  get progress(): P | null {
    return this.loading ? this.loading.progress : null
  }

  /** Current data value if succeeded, otherwise null. */
  get data(): A | null {
    return this.success ? this.success.data : null
  }

  /** Current error value if failed, otherwise null. */
  get error(): E | null {
    return this.failure ? this.failure.error : null
  }

  /** Creates a new QueryState with explicit loading/success/failure states. */
  constructor(args: {
    loading: { time?: DateTime.Utc | undefined; progress: P } | null
    success: { time?: DateTime.Utc | undefined; data: A } | null
    failure: { time?: DateTime.Utc | undefined; error: E } | null
  }) {
    super()
    this.loading = args.loading
    this.success = args.success
    this.failure = args.failure
  }

  /** Creates a new QueryState with explicit loading/success/failure states. */
  static make<A, E, P>(args: {
    loading: { time?: DateTime.Utc | undefined; progress: P } | null
    success: { time?: DateTime.Utc | undefined; data: A } | null
    failure: { time?: DateTime.Utc | undefined; error: E } | null
  }) {
    return new QueryState(args)
  }

  private static initial_ = QueryState.make<never, never, never>({
    loading: null,
    success: null,
    failure: null,
  })
  /** Returns an empty QueryState. */
  static initial = <A = never, E = never, P = undefined>(): QueryState<
    A,
    E,
    P
  > => QueryState.initial_

  static started: {
    /** Creates a QueryState in loading state. */
    <P, A = never, E = never>(loading: {
      time?: DateTime.Utc
      progress: P
    }): QueryState<A, E, P>
    /** Creates a QueryState in loading state. */
    <A = never, E = never>(loading?: {
      time?: DateTime.Utc
      progress?: undefined
    }): QueryState<A, E, undefined>
  } = <P, A = never, E = never>(loading?: {
    time?: DateTime.Utc
    progress?: P
  }): QueryState<A, E, P> =>
    QueryState.make<A, E, P>({
      loading: {
        ...(loading?.time ? { time: loading.time } : {}),
        progress: loading?.progress as P,
      },
      success: null,
      failure: null,
    })

  /** Creates a QueryState in success state. */
  static succeeded = <A, E, P>(success: {
    time?: DateTime.Utc
    data: A
  }): QueryState<A, E, P> =>
    QueryState.make({ loading: null, success, failure: null })

  /** Creates a QueryState in failure state. */
  static failed = <A, E, P>(failure: {
    time?: DateTime.Utc
    error: E
  }): QueryState<A, E, P> =>
    QueryState.make({ loading: null, success: null, failure })

  static start: {
    /** Sets loading state. Success and failure are preserved. */
    <A, E>(loading?: {
      time?: DateTime.Utc | undefined
      progress?: undefined
    }): (self: QueryState<A, E, undefined>) => QueryState<A, E, undefined>
    /** Sets loading state. Success and failure are preserved. */
    <A, E, P, P1 extends P>(loading: {
      time?: DateTime.Utc | undefined
      progress: P1
    }): (self: QueryState<A, E, P>) => QueryState<A, E, P>
  } =
    <A, E, P, P1 extends P>(loading?: {
      time?: DateTime.Utc | undefined
      progress?: P1
    }) =>
    (self: QueryState<A, E, P>): QueryState<A, E, P> =>
      QueryState.make({
        ...self,
        loading: { time: loading?.time, progress: loading?.progress as P1 },
      })
  /** Sets loading state. Success and failure are preserved. */
  start<P1 extends P>(
    ...[loading]: P extends undefined
      ? [
          loading?: {
            time?: DateTime.Utc | undefined
            progress?: undefined
          },
        ]
      : [
          loading: {
            time?: DateTime.Utc | undefined
            progress: P1
          },
        ]
  ): QueryState<A, E, P> {
    return this.pipe(
      QueryState.start({
        time: loading?.time,
        progress: loading?.progress as P1,
      }),
    )
  }

  /** Sets success state, removing loading and failure states. */
  static succeed =
    <A, A1 extends A, E, P>(success: { time?: DateTime.Utc; data: A1 }) =>
    (_self: QueryState<A, E, P>): QueryState<A, E, P> =>
      QueryState.succeeded(success)
  /** Sets success state, removing loading and failure states. */
  succeed<A1 extends A>(success: {
    time?: DateTime.Utc
    data: A1
  }): QueryState<A, E, P> {
    return this.pipe(QueryState.succeed(success))
  }

  /** Sets failure state, while keeping any existing success value and removing loading state. */
  static fail =
    <A, E, E1 extends E, P>(failure: { time?: DateTime.Utc; error: E1 }) =>
    (self: QueryState<A, E, P>): QueryState<A, E, P> =>
      QueryState.make({ loading: null, success: self.success, failure })
  /** Sets failure state, while keeping any existing success value and removing loading state. */
  fail<E1 extends E>(failure: {
    time?: DateTime.Utc
    error: E1
  }): QueryState<A, E, P> {
    return this.pipe(QueryState.fail(failure))
  }

  /** Explicitly sets the failure state, preserving loading and success states. */
  static setFailure =
    <A, E, E1 extends E, P>(
      failure: { time?: DateTime.Utc; error: E1 } | null,
    ) =>
    (self: QueryState<A, E, P>): QueryState<A, E, P> =>
      QueryState.make({ ...self, failure })
  /** Explicitly sets the failure state, preserving loading and success states. */
  setFailure<E1 extends E>(
    failure: {
      time?: DateTime.Utc
      error: E1
    } | null,
  ): QueryState<A, E, P> {
    return this.pipe(QueryState.setFailure(failure))
  }

  /**
   * Applies an Either result to the state, storing success or failure and removing loading state.
   */
  static applyEither =
    <A, A1 extends A, E, E1 extends E, P>(
      either: Either.Either<A1, E1>,
      info?: { time?: DateTime.Utc },
    ) =>
    (self: QueryState<A, E, P>): QueryState<A, E, P> =>
      Either.match(either, {
        onRight: _ =>
          self.succeed({ ...(info?.time ? { time: info.time } : {}), data: _ }),
        onLeft: _ =>
          self.fail({ ...(info?.time ? { time: info.time } : {}), error: _ }),
      })
  /**
   * Applies an Either result to the state, storing success or failure and removing loading state.
   */
  applyEither<A1 extends A, E1 extends E>(
    either: Either.Either<A1, E1>,
    info?: { time?: DateTime.Utc },
  ): QueryState<A, E, P> {
    return this.pipe(QueryState.applyEither(either, info))
  }

  /** Transforms success data when present. */
  static map =
    <A, B>(f: (a: A) => B) =>
    <E, P>(self: QueryState<A, E, P>): QueryState<B, E, P> =>
      QueryState.make({
        ...self,
        success: self.success
          ? { ...self.success, data: f(self.success.data) }
          : null,
      })
  /** Transforms success data when present. */
  map<B>(f: (a: A) => B): QueryState<B, E, P> {
    return this.pipe(QueryState.map(f))
  }

  /** Updates loading progress. */
  static makeProgress =
    <P, P1 extends P>(progress: P1) =>
    <A, E>(self: QueryState<A, E, P>): QueryState<A, E, P> =>
      QueryState.make({
        ...self,
        loading: {
          ...(self.loading?.time ? { time: self.loading?.time } : {}),
          progress,
        },
      })
  /** Updates loading progress. */
  makeProgress<P1 extends P>(progress: P1): QueryState<A, E, P> {
    return this.pipe(QueryState.makeProgress(progress))
  }

  /** Clears success state while preserving loading and failure states. */
  static invalidate = <A, E, P>(
    self: QueryState<A, E, P>,
  ): QueryState<A, E, P> => QueryState.make({ ...self, success: null })
  /** Clears success state while preserving loading and failure states. */
  invalidate(): QueryState<A, E, P> {
    return QueryState.invalidate(this)
  }

  static trackEffect: {
    /** Wraps an Effect to update QueryState on start and completion. */
    <A, E, R, A1 extends A, E1 extends E, P, I = void>(
      updateQueryState: (
        f: (state: QueryState<A, E, P>) => QueryState<A, E, P>,
      ) => void,
      effect:
        | Effect.Effect<A1, E1, R>
        | ((
            input: I,
            updateQueryState: (
              f: (state: QueryState<A, E, P>) => QueryState<A, E, P>,
            ) => void,
          ) => Effect.Effect<A1, E1, R>),
      info: { initialProgress: P },
    ): (input: I) => Effect.Effect<A1, E1, R>
    /** Wraps an Effect to update QueryState on start and completion. */
    <A, E, R, A1 extends A, E1 extends E, I = void>(
      updateQueryState: (
        f: (state: QueryState<A, E, undefined>) => QueryState<A, E, undefined>,
      ) => void,
      effect:
        | Effect.Effect<A1, E1, R>
        | ((
            input: I,
            updateQueryState: (
              f: (
                state: QueryState<A, E, undefined>,
              ) => QueryState<A, E, undefined>,
            ) => void,
          ) => Effect.Effect<A1, E1, R>),
      info?: { initialProgress?: undefined },
    ): (input: I) => Effect.Effect<A1, E1, R>
  } =
    <A, E, R, A1 extends A, E1 extends E, P, I = void>(
      updateQueryState: (
        f: (state: QueryState<A, E, P>) => QueryState<A, E, P>,
      ) => void,
      effect:
        | Effect.Effect<A1, E1, R>
        | ((
            input: I,
            updateQueryState: (
              f: (state: QueryState<A, E, P>) => QueryState<A, E, P>,
            ) => void,
          ) => Effect.Effect<A1, E1, R>),
      info?: { initialProgress?: P },
    ) =>
    (input: I): Effect.Effect<A1, E1, R> =>
      Effect.gen(function* () {
        const now = yield* DateTime.now
        updateQueryState(
          QueryState.start({ time: now, progress: info?.initialProgress as P }),
        )
        const result = yield* (
          typeof effect === 'function'
            ? effect(input, updateQueryState)
            : effect
        ).pipe(Effect.either)
        updateQueryState(QueryState.applyEither(result, { time: now }))
        return yield* result
      })
}
