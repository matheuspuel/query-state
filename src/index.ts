import { DateTime, Effect, Either, Pipeable } from 'effect'

export declare namespace QueryState {
  export type Progress<Q extends QueryState<unknown, unknown, unknown>> =
    NonNullable<Q['loading']>['progress']

  export type Data<Q extends QueryState<unknown, unknown, unknown>> =
    NonNullable<Q['success']>['data']

  export type Error<Q extends QueryState<unknown, unknown, unknown>> =
    NonNullable<Q['failure']>['error']
}

export class QueryState<A, E, P = undefined> extends Pipeable.Class() {
  loading: { time?: DateTime.Utc | undefined; progress: P } | null
  success: { time?: DateTime.Utc | undefined; data: A } | null
  failure: { time?: DateTime.Utc | undefined; error: E } | null

  get isLoading(): boolean {
    return !!this.loading
  }

  get progress(): P | null {
    return this.loading ? this.loading.progress : null
  }

  get data(): A | null {
    return this.success ? this.success.data : null
  }

  get error(): E | null {
    return this.failure ? this.failure.error : null
  }

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
  static initial = <A = never, E = never, P = undefined>(): QueryState<
    A,
    E,
    P
  > => QueryState.initial_

  static started: {
    <P, A = never, E = never>(loading: {
      time?: DateTime.Utc
      progress: P
    }): QueryState<A, E, P>
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

  static succeeded = <A, E, P>(success: {
    time?: DateTime.Utc
    data: A
  }): QueryState<A, E, P> =>
    QueryState.make({ loading: null, success, failure: null })

  static failed = <A, E, P>(failure: {
    time?: DateTime.Utc
    error: E
  }): QueryState<A, E, P> =>
    QueryState.make({ loading: null, success: null, failure })

  static start: {
    <A, E>(loading?: {
      time?: DateTime.Utc | undefined
      progress?: undefined
    }): (self: QueryState<A, E, undefined>) => QueryState<A, E, undefined>
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

  static succeed =
    <A, A1 extends A, E, P>(success: { time?: DateTime.Utc; data: A1 }) =>
    (_self: QueryState<A, E, P>): QueryState<A, E, P> =>
      QueryState.succeeded(success)
  succeed<A1 extends A>(success: {
    time?: DateTime.Utc
    data: A1
  }): QueryState<A, E, P> {
    return this.pipe(QueryState.succeed(success))
  }

  static fail =
    <A, E, E1 extends E, P>(failure: { time?: DateTime.Utc; error: E1 }) =>
    (self: QueryState<A, E, P>): QueryState<A, E, P> =>
      QueryState.make({ loading: null, success: self.success, failure })
  fail<E1 extends E>(failure: {
    time?: DateTime.Utc
    error: E1
  }): QueryState<A, E, P> {
    return this.pipe(QueryState.fail(failure))
  }

  static setFailure =
    <A, E, E1 extends E, P>(
      failure: { time?: DateTime.Utc; error: E1 } | null,
    ) =>
    (self: QueryState<A, E, P>): QueryState<A, E, P> =>
      QueryState.make({ ...self, failure })
  setFailure<E1 extends E>(
    failure: {
      time?: DateTime.Utc
      error: E1
    } | null,
  ): QueryState<A, E, P> {
    return this.pipe(QueryState.setFailure(failure))
  }

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
  applyEither<A1 extends A, E1 extends E>(
    either: Either.Either<A1, E1>,
    info?: { time?: DateTime.Utc },
  ): QueryState<A, E, P> {
    return this.pipe(QueryState.applyEither(either, info))
  }

  static map =
    <A, B>(f: (a: A) => B) =>
    <E, P>(self: QueryState<A, E, P>): QueryState<B, E, P> =>
      QueryState.make({
        ...self,
        success: self.success
          ? { ...self.success, data: f(self.success.data) }
          : null,
      })
  map<B>(f: (a: A) => B): QueryState<B, E, P> {
    return this.pipe(QueryState.map(f))
  }

  static makeProgress =
    <P, P1 extends P>(progress: P1) =>
    <A, E>(self: QueryState<A, E, P>): QueryState<A, E, P> =>
      QueryState.make({
        ...self,
        failure: null,
        loading: {
          ...(self.loading?.time ? { time: self.loading?.time } : {}),
          progress,
        },
      })
  makeProgress<P1 extends P>(progress: P1): QueryState<A, E, P> {
    return this.pipe(QueryState.makeProgress(progress))
  }

  static invalidate = <A, E, P>(
    self: QueryState<A, E, P>,
  ): QueryState<A, E, P> => QueryState.make({ ...self, success: null })
  invalidate(): QueryState<A, E, P> {
    return QueryState.invalidate(this)
  }

  static trackEffect: {
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
