# QueryState

Type safe, immutable query state representation
with loading, success, and failure states.

Useful for defining UI state related to asynchronous operations.

This allows use cases like:

- Show stale data (`success`) while refreshing (`loading`)
- Display an error (`failure`) alongside stale data (`success`)
- Track loading progress while retaining previous results

## State properties

Each `QueryState` instance has three properties
that can be independently set or cleared:

| Property  | Type                                           | Meaning                              |
| --------- | ---------------------------------------------- | ------------------------------------ |
| `loading` | `{ time?: DateTime.Utc, progress: P } \| null` | Current loading state.               |
| `success` | `{ time?: DateTime.Utc, data: A } \| null`     | Last still valid, successful result. |
| `failure` | `{ time?: DateTime.Utc, error: E } \| null`    | Last still applicable failure.       |

## Combination of state properties

The possible combinations of state properties
allow for a comprehensive representation of an operations' state.

| Loading | Success | Failure | Meaning                                                      |
| ------- | ------- | ------- | ------------------------------------------------------------ |
| -       | -       | -       | The operation has not started.                               |
| ✅      | -       | -       | In progress, no previous data or errors.                     |
| -       | ✅      | -       | Successfully completed.                                      |
| -       | -       | ✅      | Failed.                                                      |
| ✅      | ✅      | -       | Refreshing with stale data available.                        |
| ✅      | -       | ✅      | Retrying after a previous failure.                           |
| -       | ✅      | ✅      | Has stale data, but failed while refreshing.                 |
| ✅      | ✅      | ✅      | Has stale data, failed while refreshing and is now retrying. |

## Key behaviors

- `start()` sets `loading` and preserves `success` and `failure`
- `succeed()` sets `success` and clears `loading` and `failure`
- `fail()` sets `failure`, clears `loading`, but **preserves** `success`

## Install

```sh
pnpm add @matheuspuel/query-state
```

## Usage

```ts
import { QueryState } from '@matheuspuel/query-state'

// Create an empty QueryState
let queryState = QueryState.initial<
  // success data type
  { count: number },
  // failure error type
  'NetworkError' | 'ValidationError'
>()
console.log(queryState)
// QueryState { loading: null, success: null, failure: null }

// Start
queryState = queryState.start()
console.log(queryState)
// QueryState { loading: { progress: undefined }, success: null, failure: null }

// Fail
queryState = queryState.fail({ error: 'NetworkError' })
console.log(queryState)
// QueryState { loading: null, success: null, failure: { error: 'NetworkError' } }

// Retry
queryState = queryState.start()
console.log(queryState)
// QueryState { loading: { progress: undefined }, success: null, failure: { error: 'NetworkError' } }

// Succeed
queryState = queryState.succeed({ data: { count: 1 } })
console.log(queryState)
// QueryState { loading: null, success: { data: { count: 1 } }, failure: null }

// Refresh, but fail and retry again
queryState = queryState.start()
console.log(queryState)
// QueryState { loading: { progress: undefined }, success: { data: { count: 1 } }, failure: null }
queryState = queryState.fail({ error: 'ValidationError' })
console.log(queryState)
// QueryState { loading: null, success: { data: { count: 1 } }, failure: { error: 'ValidationError' } }
queryState = queryState.start()
console.log(queryState)
// QueryState { loading: { progress: undefined }, success: { data: { count: 1 } }, failure: { error: 'ValidationError' } }
```

### Tracking progress

You can track the loading progress for showing a progress bar.

```ts
import { QueryState } from '@matheuspuel/query-state'

let queryState = QueryState.initial<
  string,
  Error,
  // loading progress type
  number
>()
// QueryState { loading: null, success: null, failure: null }

queryState = queryState.makeProgress(0.1)
console.log(queryState)
// QueryState { loading: { progress: 0.1 }, success: null, failure: null }
queryState = queryState.makeProgress(0.2)
console.log(queryState)
// QueryState { loading: { progress: 0.2 }, success: null, failure: null }
```

Or you can use it to describe the current step in progress.

```ts
let queryState = QueryState.initial<
  string,
  Error,
  'validating' | 'fetching' | 'calculating'
>().makeProgress('validating')
console.log(queryState)
// QueryState { loading: { progress: 'validating' }, success: null, failure: null }
```

### Set times

Set the time the operation started and completed to help determining
how old the data is or how long the operation is taking to complete.

```ts
import { QueryState } from '@matheuspuel/query-state'
import { DateTime } from 'effect'

let queryState: QueryState<number, Error> = QueryState.initial()
console.log(queryState)

// Start and set time
queryState = queryState.start({
  time: DateTime.unsafeMake('2026-01-01T00:00:00Z'),
})
console.log(queryState)
// QueryState {
//   loading: { time: DateTime.Utc(2026-01-01T00:00:00.000Z), progress: undefined },
//   success: null,
//   failure: null
// }

// Succeed and set the result time
queryState = queryState.succeed({
  data: 10,
  time: DateTime.unsafeMake('2026-01-01T00:00:00Z'),
})
console.log(queryState)
// QueryState {
//   loading: null,
//   success: { data: 10, time: DateTime.Utc(2026-01-01T00:00:00.000Z) },
//   failure: null
// }

// Fail and set the failure time
queryState = queryState.fail({
  error: new Error('Something went wrong'),
  time: DateTime.unsafeMake('2026-01-01T00:00:00Z'),
})
console.log(queryState)
// QueryState {
//   loading: null,
//   success: { data: 10, time: DateTime.Utc(2026-01-01T00:00:00.000Z) },
//   failure: {
//     error: Error: Something went wrong
//         at ...
//     time: DateTime.Utc(2026-01-01T00:00:00.000Z)
//   }
// }
```

### Track Effect

Use QueryState.trackEffect to run an Effect
while automatically updating the QueryState.

```ts
import { QueryState } from '@matheuspuel/query-state'
import { Effect } from 'effect'

const validate = (input: {
  name: string
}): Effect.Effect<{ id: number }, 'ValidationError'> =>
  Effect.succeed({ id: 3 })

const fetchResult = (data: {
  id: number
}): Effect.Effect<{ count: number }, 'NetworkError'> =>
  Math.random() > 0.7
    ? Effect.succeed({ count: 15 })
    : Effect.fail('NetworkError')

let queryState = QueryState.initial<
  { count: number },
  'NetworkError' | 'ValidationError',
  'validating' | 'fetching'
>()

const updateQueryState = (
  f: (state: typeof queryState) => typeof queryState,
) => {
  queryState = f(queryState)
  console.log(queryState)
}

const run = QueryState.trackEffect(
  updateQueryState,
  (input: { name: string }, update) =>
    Effect.gen(function* () {
      const data = yield* validate(input)
      update(_ => _.makeProgress('fetching'))
      const result = yield* fetchResult(data)
      return result
    }),
  { initialProgress: 'validating' },
)

Effect.gen(function* () {
  const result = yield* run({ name: 'Test' }).pipe(Effect.retry({}))
  console.log('Final result:', result)
}).pipe(Effect.runSync)

// QueryState { loading: { time: DateTime.Utc(2026-02-11T20:39:27.392Z), progress: 'validating' }, success: null, failure: null }
// QueryState { loading: { time: DateTime.Utc(2026-02-11T20:39:27.392Z), progress: 'fetching' }, success: null, failure: null }
// QueryState { loading: null, success: null, failure: { time: DateTime.Utc(2026-02-11T20:39:27.392Z), error: 'NetworkError' } }
// QueryState { loading: { time: DateTime.Utc(2026-02-11T20:39:27.403Z), progress: 'validating' }, success: null, failure: { time: DateTime.Utc(2026-02-11T20:39:27.392Z), error: 'NetworkError' } }
// QueryState { loading: { time: DateTime.Utc(2026-02-11T20:39:27.403Z), progress: 'fetching' }, success: null, failure: { time: DateTime.Utc(2026-02-11T20:39:27.392Z), error: 'NetworkError' } }
// QueryState { loading: null, success: { time: DateTime.Utc(2026-02-11T20:39:27.403Z), data: { count: 15 } }, failure: null }
// Final result: { count: 15 }
```
