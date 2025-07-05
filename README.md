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

The easiest way to consume the library is to import via the CDN by taking
advantage of ECMAScript Modules:

```html
<script type="module">
  import { defineStore } from 'https://cdn.jsdelivr.net/npm/syncrate@latest/+esm'
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

and then consume as usual:

```typescript
import { defineStore } from 'syncrate'
```

This approach is recommended in case you already have an existing TypeScript
project or you would like to keep all type safe.

## How to Use

**Creating a New Store**

First steps is to use `defineStore` function to instantiate a new store:

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

The `defineStore` function requires a unique store `name` and an `object` as
initial state.

**Getting values from the Store**

Once the store is defined, you can simply call the `store.get` method passing a
`callback` function that receives the `state` object as first parameter, and
simply extract the value you want:

```typescript
/* ...code from previous example */

let todos = []

store.get((state) => {
  todos = state.todos
})

console.log(todos) /* return an array of todos */
```

This will also subscribe the reader `callback` into an internal store listeners
list, which will notify all readers subscribed to it on every store update.

If for some reason you would like to unsubscribe from those changes, the
`store.get` method returns an unsubscribe `callback` function tha can be called
to achieve that.

```typescript
/* ...code from previous example */

const unsubscribe = store.get((state) => {
  todos = state.todos
})

unsubscribe() /* will unsubscribe the reader callback from all store changes */
```

**Updating a value from the Store**

Similarly with `store.get`, the store also contains a `store.set` method that
can be used to perform updates in the state:

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

console.log(todos) /* will have all 3 todos */
```

**Listening for store changes when getting a value**

As mentioned before, `store.get` reader `callback` will be subscribed for store
changes. This means that any operations defined inside of that `callback` will
be called every time the store changes.

```typescript
/* ...code from previous example */

store.get((state) => {
  test = state.todos

  /* here you can perform a re-render or any operation you would like */
  console.log('changed')
})
```

**Listening for store changes from anywhere**

When the you call `store.set` a new `CustomEvent` is dispatched in the
`document` announcing the changes. The event name is a combination of the
`syncrate:` prefix and the store `name` used when `defineStore` function has
been called.

That event will also send the changed `state` in the `event.detail` property.

```typescript
/* listen from anywhere in the application */
document.addEventListener('syncrate:todos', (event) => {
  if (!event.detail) return

  const todos = event.detail

  /* here you can perform any operation you would like */
  alert(todos.at(-1).title)
})
```

All store event updates are called in the `document` itself, and it bubble up by
default. This means that any component withing the `document` will be able to
listen for updates, regardless on where they are located.

Also, If you are mutating the `store` values withing a Web Components, the
`CustomEvent` also have `composed` default to `true`, this ensures the event
will propagate across the shadow DOM boundary into the standard DOM.

Listening for the `CustomEvent` ensures the business logic is as decoupled as
possible from the component itself, specially when using Web Components.

**CustomEvent options**

If for some reason you would like to customize the behavior of the emitted
event, the `defineStore` function also accepts an optional configuration object:

```typescript
const store = defineStore({
  name: 'todos',
  state: {
    todos: []
  },
  options: {
    /* customizes the event behavior */
    event: {
      bubbles: true,
      cancelable: true,
      composed: true
    }
  }
})
```

**Persisting state on local or session storage**

The store also comes with an out of the box feature to persist state in the
`sessionStorage` or `localStorage`. To achieve that, you can simply enable it in
the options:

```typescript
const store = defineStore({
  name: 'todos',
  state: {
    todos: []
  },
  options: {
    /* enables storage persistency */
    storage: {
      persist: true,
      type: 'session' /* default value, not required to be passed */
    }
  }
})
```

Setting `persist` to `true` will use the `session` storage by default, but you
can always overwrite it by setting `type` option as `local`.

```typescript
const store = defineStore({
  name: 'todos',
  state: {
    todos: []
  },
  options: {
    storage: {
      persist: true,
      type: 'local' /* use local storage instead */
    }
  }
})
```

## Implementation Example

Here we will create a bare minimal todo app that consumes the store we created
previously withing Web Components.

**Defining our Store**

In this example we will use the brilliant library
[lit-html](https://www.npmjs.com/package/lit-html) to render our components
along with the `syncrate` store.

```typescript
/* import the library from the CDN */
import { defineStore } from 'https://cdn.jsdelivr.net/npm/syncrate@latest/+esm'

/* instantiate the store */
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

This class include helper methods that allow re-rendering, and it also handles
the shadowDOM for us.

```typescript
class BaseElement extends HTMLElement {
  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.css = new CSSStyleSheet()
    this.html = document.createElement('template')
  }

  /* helper method used render the elements */
  render() {
    while (this.shadow.firstChild) {
      this.shadow.lastChild.remove()
    }

    const host = this.html.content.cloneNode(true)
    this.shadow.appendChild(host)
  }

  /* lifecycle that runs whenever the component is mounted in the DOM */
  connectedCallback() {
    this.shadow.adoptedStyleSheets = [this.css]
    this.render()
  }
}
```

**The TodoList Component**

Our `TodoList` component will extend our `BaseElement` class, so it will inherit
all helpers we created in the previous steps.

Inside this component, we also consume our `store` by setting an internal state.

```typescript
class TodoList extends BaseElement {
  constructor() {
    super()
    this.todos = []

    /* use the store to get all the initial values */
    store.get((state) => {
      this.todos = state.todos

      /* register our render method inside the reader, so it will be called every time the state changes, therefore re-rendering the element */
      this.render()
    })
  }

  render() {
    /* example on how to style the elements */
    this.css.replace`
      ul {
        list-style: none;
        padding-inline-start: 0;
      }
    `

    /* construct a list of todos */
    const items = this.todos?.map((todo) => `<li>${todo.title}</li>`).join('')

    /* inject the result in the html (this is an example only, please don't use innerHTML in a real world project to avoid security issues) */
    this.html.innerHTML = `
      <ul>
        ${items}
      </ul>
    `

    /* call the helper method from the superclass */
    super.render()
  }
}

/* register our custom element into the DOM */
customElements.define('todo-list', TodoList)
```

**The TodoUpdater Component**

Our `TodoUpdater` will have a simple `<input>` and `<button>` that upon click it
will add a new todo into our store. Since the `TodoList` render method has
subscribed for changes, it will re-render accordantly.

```typescript
class TodoUpdater extends BaseElement {
  connectedCallback() {
    /* don't forget to call the superclass method when overwriting it */
    super.connectedCallback()

    /* bind the handler to the button */
    const button = this.shadow.querySelector('button')
    const input = this.shadow.querySelector('input')

    button?.addEventListener('click', () => {
      this.handleClick(input)
    })
  }

  handleClick(input) {
    if (!input?.value) return

    /* add new todo into the store */
    store.set((state) => ({
      todos: [
        ...state.todos,
        {
          id: state.todos.length + 1,
          title: input.value
        }
      ]
    }))

    /* clean the input after todo has been created */
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

/* register our custom element into the DOM */
customElements.define('todo-updater', TodoUpdater)
```

**Using the Components**

Finally, simply mount the components in the `<body>`, give your todo a name,
click the `Add` button and see the magic happening 🎆!

```html
<body>
  <todo-list></todo-list>
  <todo-updater></todo-updater>
</body>
```

## License

This is an open-source library and is available under the
[**MIT License**](LICENSE). You are free to use, modify, and distribute the code
in accordance with the terms of the license.

## Contact me

Linkedin: [feliperdamaceno](https://www.linkedin.com/in/feliperdamaceno)
