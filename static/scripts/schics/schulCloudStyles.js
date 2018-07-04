export const styles = {
  general: {
    primaryColor: "#b10438",
    "font-family": '"PT Sans","Helvetica Neue",Helvetica,Arial,sans-serif',
    textColor: "#373a3c"
  },
  baseComponents: {
    input: generalStyle => `
      display: inline-block;
      padding: .5rem .75rem;
      font-size: 1rem;
      line-height: 1.25;
      color: #55595c;
      background-color: #fff;
      background-image: none;
      background-clip: padding-box;
      border: 1px solid rgba(0,0,0,.15);
      border-radius: .25rem;
      font-family: ${generalStyle["font-family"]};
    `,
    label: generalStyle => `
      font-family: ${generalStyle["font-family"]};
      line-height: 1.4;
      font-size: 1rem;
      color: #373a3c;
      font-weight: 400;
      display: inline-block;
      margin-bottom: .5rem;
    `,
    button: generalStyle => `
      color: #fff;
      background-color: ${generalStyle.primaryColor};
      display: inline-block;
      font-weight: 400;
      line-height: 1.25;
      text-align: center;
      white-space: nowrap;
      vertical-align: middle;
      cursor: pointer;
      user-select: none;
      border: 1px solid ${generalStyle.primaryColor};
      padding: .5rem 2rem;
      font-size: 1rem;
      border-radius: .25rem;
      font-family: ${generalStyle["font-family"]};
    `,
    textarea: generalStyle => `
      height: 100px;
      max-width: 800px;
      font-size: 1rem;
      line-height: 1.25;
      color: #55595c;
      background-color: #fff;
      background-image: none;
      background-clip: padding-box;
      border: 1px solid rgba(0,0,0,.15);
      border-radius: .25rem;
      padding: .5rem .75rem;
      font-family: ${generalStyle["font-family"]};
    `,
    select: generalStyle => `
      font-family: ${generalStyle["font-family"]};
      color: #55595c;
      font-size: 15px;
      background: white;
      padding: 7px 10px;
      border: 1px solid rgba(0,0,0,.15);
      border-radius: .25rem;
    `
  },
  specificComponents: {
    minusButton: generalStyle => `
      border: 1px solid ${generalStyle.primaryColor};
      background-color: white;
      color: ${generalStyle.primaryColor};
      padding: 1px 6px;
    `
  }
};
