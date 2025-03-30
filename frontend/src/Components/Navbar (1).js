import { Link } from "react-router-dom"

const Navbar = () => {
  return (
    <nav style={styles.navbar}>
      <div style={styles.logoContainer}>
        <i className="fa-solid fa-house" style={styles.homeIcon}></i>
        <h1 style={styles.title}>Disaster Tracker</h1>
      </div>
      <div style={styles.navLinks}>
        <Link to="/about" style={styles.link}>
          About
        </Link>
        <Link to="/resources" style={styles.link}>
          Resources
        </Link>
        <Link to="/donate" style={styles.donateButton}>
          Donate
        </Link>
      </div>
    </nav>
  )
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 25px",
    backgroundColor: "#121212",
    color: "white",
    borderBottom: "1px solid #333",
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",
  },
  homeIcon: {
    fontSize: "20px",
    marginRight: "10px",
  },
  title: {
    margin: 0,
    fontSize: "20px",
    fontWeight: "bold",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "25px",
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontSize: "15px",
  },
  donateButton: {
    backgroundColor: "white",
    color: "black",
    padding: "8px 15px",
    borderRadius: "20px",
    textDecoration: "none",
    fontSize: "15px",
    fontWeight: "bold",
  },
}

export default Navbar;

