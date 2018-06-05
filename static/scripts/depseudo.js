window.addEventListener("load", () => {
  const headers = new Headers();
  headers.append("Authorization", document.cookie)
  console.log(document.cookie)

  fetch("http://localhost:3030/users", { headers, credentials: "include" }).then(console.log).catch(console.log)
})