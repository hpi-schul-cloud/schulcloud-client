import { document, console } from 'global';
import { storiesOf } from '@storybook/html';

import '../static/styles/lib/base.scss';

storiesOf('Headers', module)
  .add('h4', () => '<h4>h4 Hello World</h4>');


storiesOf('Buttons', module)
  .add('button', () => {
    const button = document.createElement('button');
    button.type = 'button';
    button.innerText = 'Hello Button';
    button.addEventListener('click', e => console.log(e));
    return button;
  })
  .add('default', () => '<a class="btn btn-primary" href="/">Primary</a> <a class="btn btn-secondary" href="/">Secondary</a>')
