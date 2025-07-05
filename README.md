# Syncrate

A simple and flexible state management solution for Vanilla JavaScript,
TypeScript, and Web Components.

## Table of contents

- [Installation](#installation)
- [How to Use](#how-to-use)
- [Implementation Example](#implementation-example)
- [License](#license)
- [Contact](#contact-me)

## Installation

### Using via the CDN (Recommended):

The easiest way to consume the library is to import it via the CDN by taking
advantage of ECMAScript Modules:

```html
<script type="module">
  import { defineStore } from 'https://cdn.jsdelivr.net/npm/syncrate/+esm'
</script>
```

The library was designed to be used mostly with Vanilla JavaScript and Vanilla
Web Components, so importing via the CDN is the most straightforward approach as
it does not require any build process.

### Installing as a Package:

Alternatively, you can install the library with your package manager of choice:

```bash
bun install syncrate
```

And then consume as usual:

```typescript
import { defineStore } from 'syncrate'
```

This approach is recommended if you already have an existing TypeScript project
or would like to keep everything type-safe.

## How to Use

**Creating a New Store**

First step is to use the `defineStore` function to instantiate a new store:

```typescript
const store = defineStore({
  name: 'todos',
  state: {
    todos: [
      {
        id: 1,
        title: 'Learn about syncrate!'
      },
      {
        id: 2,
        title: 'Share syncrate with my friends :P'
      }
    ]
  }
})
```

The `defineStore` function requires a unique store `name` and an `object` as the
initial state.

**Getting values from the Store**

Once the store is defined, you can call the `store.get` method by passing a
`callback` function that receives the `state` object as the first parameter:

```typescript
/* ...code from previous example */

let todos = []

store.get((state) => {
  todos = state.todos
})

console.log(todos) /* returns an array of todos */
```

This will also subscribe the reader `callback` to an internal listeners list,
which will be notified on every store update.

If you want to unsubscribe from those changes, the `store.get` method returns an
unsubscribe `callback` function:

```typescript
/* ...code from previous example */

const unsubscribe = store.get((state) => {
  todos = state.todos
})

unsubscribe() /* unsubscribes the reader callback from store changes */
```

**Updating a value from the Store**

Similarly to `store.get`, the store also provides a `store.set` method that can
be used to update the state:

```typescript
/* ...code from previous example */

store.set((state) => ({
  todos: [
    ...state.todos,
    {
      id: 3,
      title: 'Give a GitHub star to the syncrate project :P'
    }
  ]
}))

console.log(todos) /* will now include all 3 todos */
```

**Listening for store changes when getting a value**

As mentioned earlier, a `store.get` callback will be subscribed to store
changes. Any logic inside that callback will be executed on every update.

```typescript
/* ...code from previous example */

store.get((state) => {
  test = state.todos

  /* perform a rerender for example or any operation you need */
  console.log('changed')
})
```

**Listening for store changes from anywhere**

When you call `store.set`, a `CustomEvent` is dispatched on the `document`
announcing the changes. The event name is a combination of the `syncrate:`
prefix and the store `name`.

The event includes the changed `state` in the `event.detail` property.

```typescript
/* listen from anywhere in the application */
document.addEventListener('syncrate:todos', (event) => {
  if (!event.detail) return

  const todos = event.detail

  /* perform any operation you need */
  alert(todos.at(-1).title)
})
```

All store update events are dispatched on the `document`, and they bubble up by
default. This means any component within the `document` can listen for updates.

Also, if you are mutating `store` values within Web Components, the
`CustomEvent` has `composed: true` by default, ensuring the event propagates
across the shadow DOM boundary.

Listening to `CustomEvent` keeps business logic decoupled from the component,
especially when using Web Components.

**CustomEvent options**

If you want to customize the emitted event behavior, `defineStore` also accepts
an optional configuration object:

```typescript
const store = defineStore({
  name: 'todos',
  state: {
    todos: []
  },
  options: {
    event: {
      bubbles: true,
      cancelable: true,
      composed: true
    }
  }
})
```

**Persisting state on local or session storage**

The store also supports persisting state in `sessionStorage` or `localStorage`.
Enable it via the `options`:

```typescript
const store = defineStore({
  name: 'todos',
  state: {
    todos: []
  },
  options: {
    storage: {
      persist: true,
      type: 'session' /* default, optional */
    }
  }
})
```

Setting `persist: true` uses `sessionStorage` by default. To use `localStorage`
instead:

```typescript
const store = defineStore({
  name: 'todos',
  state: {
    todos: []
  },
  options: {
    storage: {
      persist: true,
      type: 'local'
    }
  }
})
```

## Implementation Example

Here we’ll create a minimal todo app that consumes the store we previously
created within Web Components.

**Defining our Store**

```typescript
import { defineStore } from 'https://cdn.jsdelivr.net/npm/syncrate/+esm'

const store = defineStore({
  name: 'todos',
  state: {
    todos: []
  },
  options: {
    storage: {
      persist: true,
      type: 'local'
    }
  }
})
```

**Creating a Base Class**

This class includes helper methods to handle shadow DOM and rendering.

```typescript
class BaseElement extends HTMLElement {
  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.css = new CSSStyleSheet()
    this.html = document.createElement('template')
  }

  /* helper method used render or rerender the elements */
  render() {
    while (this.shadow.firstChild) {
      this.shadow.lastChild.remove()
    }

    const host = this.html.content.cloneNode(true)
    this.shadow.appendChild(host)
  }

  connectedCallback() {
    this.shadow.adoptedStyleSheets = [this.css]
    this.render()
  }
}
```

**The TodoList Component**

```typescript
class TodoList extends BaseElement {
  constructor() {
    super()
    this.todos = []

    store.get((state) => {
      this.todos = state.todos

      /* call the render method in the reader, and it will be re-called every time the state changes */
      this.render()
    })
  }

  render() {
    this.css.replace`
      ul {
        list-style: none;
        padding-inline-start: 0;
      }
    `

    const items = this.todos?.map((todo) => `<li>${todo.title}</li>`).join('')

    /* to prevent security concerns, avoid using innerHTML in a real-world project; this is simply an example */
    this.html.innerHTML = `
      <ul>
        ${items}
      </ul>
    `

    super.render()
  }
}

customElements.define('todo-list', TodoList)
```

**The TodoUpdater Component**

```typescript
class TodoUpdater extends BaseElement {
  connectedCallback() {
    super.connectedCallback()

    const button = this.shadow.querySelector('button')
    const input = this.shadow.querySelector('input')

    button?.addEventListener('click', () => {
      this.handleClick(input)
    })
  }

  handleClick(input) {
    if (!input?.value) return

    store.set((state) => ({
      todos: [
        ...state.todos,
        {
          id: state.todos.length + 1,
          title: input.value
        }
      ]
    }))

    input.value = ''
  }

  render() {
    this.html.innerHTML = `
      <h3>Add Todo:</h3>

      <div>
        <input type="text" />
        <button>Add</button>
      </div>
    `

    super.render()
  }
}

customElements.define('todo-updater', TodoUpdater)
```

**Using the Components**

```html
<body>
  <todo-list></todo-list>
  <todo-updater></todo-updater>
</body>
```

After mounting all elements, name your todo, press the `Add` button, and watch
the magic happen! 🎆

## License

This is an open-source library and is available under the
[**MIT License**](LICENSE). You are free to use, modify, and distribute the code
in accordance with the terms of the license.

## Contact me

Linkedin: [feliperdamaceno](https://www.linkedin.com/in/feliperdamaceno)
