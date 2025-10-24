
function Home() {

  const token = localStorage.getItem("tokenDentis");
  if (!token) {
    window.location.href = "/login";
  }
  return (
    <div>Home</div>
  )
}

export default Home