import { document, console } from 'global';
import { storiesOf } from '@storybook/html';
import "../static/styles/lib/bootstrap/scss/_buttons.scss";

storiesOf('Demo', module)
  .add('heading', () => '<h1>Hello World</h1>')
  .add('button', () => {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerText = 'Hello Button';
    button.addEventListener('click', e => console.log(e));
    return button;
  });
