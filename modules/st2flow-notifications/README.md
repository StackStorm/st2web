# `@stackstorm/st2flow-notifications`

This is a generic module for displaying notifications. Each type of notification is styled according to its type: 

- ![#f03c15](https://placehold.it/15/fb9494/000000?text=+) `error`
- ![#c5f015](https://placehold.it/15/ffe457/000000?text=+) `warning`
- ![#1589F0](https://placehold.it/15/84d3f5/000000?text=+) `info`
- ![#1589F0](https://placehold.it/15/adea91/000000?text=+) `success`

## Usage

```js
<Notifications 
  position={string} 
  notifications={Array<notification>}
  onRemove={Function(notification)} 
/>
```
**Properties:**

- **position** - determines the position of the notifications container. Possible values:  
    `top | top-left | top-right | bottom | bottom-left | bottom-right`
- **notifications** - array of notification objects with the follow properties:
    - **type** - `error | warning | info | success`
    - **message** - string message to be displayed.
- **onRemove** - callback function whenever a user clicks the "close" button for a notification. The callback is passed the notification which was clicked. 

## Example

```js
const Notifications = require('@stackstorm/st2flow-notifications');

class Foo extends Component {
  state = {
    // 1. Notifications are usually derived from state
    errors: [ new Error('foobar'), new Error('barfoo') ],
    messages: [ { text: 'foobar' }, { text: 'barfoo' } ],
  }
  
  // 2. Create "notification" objects with `type` and `message` properties
  get notifications() {
    return errors.map(e => ({
      type: 'error',
      message: e.message,
    })).concat(
      messages.map(m => ({
        type: 'info',
        message: m.text,
      }))
    );
  }
  
  // 3. Handle the "remove" event (which user clicks "close" button)
  handleNotificationRemove(notification) {
    switch(notification.type) {
      case 'error':
        this.setState({
          errors: this.state.errors.filter(e => e.message !== notification.message)
        });
        break;
        
      case 'info':
        this.setState({
          messages: this.state.messages.filter(m => m.text !== notification.message)
        });
        break;
    }
  }
  
  render() {
    // 4. Notifications are absolutely positioned within a relative parent
    return (
      <div style={{ position: 'relative' }}>
        <Notifications position="top-right" notifications={this.notifications} onRemove={this.handleNotificationRemove} />
      </div>
    );
  }
}
```
