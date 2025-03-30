import React from 'react';
import { useNavigate } from 'react-router-dom';

// Severity color mapping
const getSeverityColor = (severity) => {
  switch (severity?.toLowerCase()) {
    case "severe damage":
    case "critical":
      return {
        main: "#dc3545",
        light: "rgba(220, 53, 69, 0.1)",
        gradient: "linear-gradient(135deg, #dc3545, #ff4d59)",
        shadow: "0 4px 15px rgba(220, 53, 69, 0.3)"
      }
    case "mild damage":
    case "mild_damage":
    case "medium":
      return {
        main: "#ffc107",
        light: "rgba(255, 193, 7, 0.1)",
        gradient: "linear-gradient(135deg, #ffc107, #ffda6a)",
        shadow: "0 4px 15px rgba(255, 193, 7, 0.3)"
      }
    case "little or no damage":
    case "low":
      return {
        main: "#28a745",
        light: "rgba(40, 167, 69, 0.1)",
        gradient: "linear-gradient(135deg, #28a745, #48c664)",
        shadow: "0 4px 15px rgba(40, 167, 69, 0.3)"
      }
    case "high":
      return {
        main: "#fd7e14",
        light: "rgba(253, 126, 20, 0.1)",
        gradient: "linear-gradient(135deg, #fd7e14, #ff9a47)",
        shadow: "0 4px 15px rgba(253, 126, 20, 0.3)"
      }
    default:
      return {
        main: "#6c757d",
        light: "rgba(108, 117, 125, 0.1)",
        gradient: "linear-gradient(135deg, #6c757d, #868e96)",
        shadow: "0 4px 15px rgba(108, 117, 125, 0.3)"
      }
  }
}

// Category styling configuration
const getCategoryConfig = (category) => {
  const categories = {
    flood: {
      color: "#0d6efd",
      light: "rgba(13, 110, 253, 0.1)",
      gradient: "linear-gradient(135deg, #0d6efd, #3d8bfd)",
      icon: "fa-solid fa-water"
    },
    fire: {
      color: "#dc3545",
      light: "rgba(220, 53, 69, 0.1)",
      gradient: "linear-gradient(135deg, #dc3545, #ff4d59)",
      icon: "fa-solid fa-fire"
    },
    earthquake: {
      color: "#6f42c1",
      light: "rgba(111, 66, 193, 0.1)",
      gradient: "linear-gradient(135deg, #6f42c1, #8c68d6)",
      icon: "fa-solid fa-house-crack"
    },
    storm: {
      color: "#17a2b8",
      light: "rgba(23, 162, 184, 0.1)",
      gradient: "linear-gradient(135deg, #17a2b8, #3dd5f3)",
      icon: "fa-solid fa-cloud-bolt"
    },
    tornado: {
      color: "#17a2b8",
      light: "rgba(23, 162, 184, 0.1)",
      gradient: "linear-gradient(135deg, #17a2b8, #3dd5f3)",
      icon: "fa-solid fa-tornado"
    },
    tornadoes: {
      color: "#17a2b8",
      light: "rgba(23, 162, 184, 0.1)",
      gradient: "linear-gradient(135deg, #17a2b8, #3dd5f3)",
      icon: "fa-solid fa-tornado"
    },
    drought: {
      color: "#fd7e14",
      light: "rgba(253, 126, 20, 0.1)",
      gradient: "linear-gradient(135deg, #fd7e14, #ff9a47)",
      icon: "fa-solid fa-sun"
    },
    landslide: {
      color: "#6c757d",
      light: "rgba(108, 117, 125, 0.1)",
      gradient: "linear-gradient(135deg, #6c757d, #868e96)",
      icon: "fa-solid fa-mountain"
    }
  }
  
  return categories[category?.toLowerCase()] || {
    color: "#6c757d",
    light: "rgba(108, 117, 125, 0.1)",
    gradient: "linear-gradient(135deg, #6c757d, #868e96)",
    icon: "fa-solid fa-exclamation-triangle"
  }
}

// Function to format date
const formatDate = (timestamp) => {
  if (!timestamp) return "Recent"
  
  const date = new Date(timestamp.seconds * 1000)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return "Today"
  } else if (diffDays === 1) {
    return "Yesterday"
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

const DisasterCard = ({ disaster }) => {
  const navigate = useNavigate();
  const severityColor = getSeverityColor(disaster.severity)
  const categoryConfig = getCategoryConfig(disaster.category || disaster.Label)
  
  return (
    <div 
      style={{
        ...styles.card,
        borderColor: severityColor.main,
        boxShadow: `0 10px 25px rgba(0, 0, 0, 0.1), 0 0 0 1px ${severityColor.main}`,
      }}
    >
      <div style={styles.cardTop}>
        <div style={styles.dateLabel}>
          <i className="fa-regular fa-clock" style={styles.dateIcon}></i>
          {formatDate(disaster.timestamp)}
        </div>
        
        <span style={{
          ...styles.severityBadge,
          background: severityColor.gradient,
          boxShadow: severityColor.shadow,
        }}>
          {disaster.severity || disaster.Severity}
        </span>
      </div>
      
      <div style={styles.cardHeader}>
        <h3 style={styles.title}>{disaster.title}</h3>
      </div>
      
      <div style={styles.locationContainer}>
        <i className="fa-solid fa-location-dot" style={styles.locationIcon}></i>
        <span style={styles.location}>{disaster.location || disaster.Location}</span>
      </div>
      
      <div style={styles.categoryContainer}>
        <span style={{
          ...styles.categoryBadge,
          backgroundColor: categoryConfig.light,
          color: categoryConfig.color,
          boxShadow: `inset 0 0 0 1px ${categoryConfig.color}20`,
        }}>
          <i className={categoryConfig.icon} style={styles.categoryIcon}></i>
          {disaster.category || disaster.Label}
        </span>
      </div>
      
      <div style={styles.summaryContainer}>
        <p style={styles.summary}>{disaster.summary || disaster.Summary}</p>
      </div>
      
      {disaster.injured_or_dead_people && (
        <div style={styles.dataField}>
          <span style={styles.dataLabel}>Casualties:</span>
          <span style={styles.dataValue}>{disaster.injured_or_dead_people}</span>
        </div>
      )}
      
      {disaster.Strategy && (
        <div style={styles.strategyContainer}>
          <h4 style={styles.sectionTitle}>Detailed Information</h4>
          <p style={styles.strategyText}>{disaster.Strategy}</p>
        </div>
      )}
      
      {disaster.imageUrl && (
        <div style={styles.imageContainer}>
          <img 
            src={disaster.imageUrl} 
            alt={disaster.title} 
            style={styles.disasterImage} 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/placeholder-disaster.jpg";
            }}
          />
        </div>
      )}
      
      <div style={styles.statsRow}>
        {disaster.affectedPeople && (
          <div style={styles.statItem}>
            <span style={styles.statValue}>
              {disaster.affectedPeople}
            </span>
            <span style={styles.statLabel}>Affected</span>
          </div>
        )}
        
        {disaster.damageExtent && (
          <>
            <div style={styles.divider}></div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>
                {disaster.damageExtent}
              </span>
              <span style={styles.statLabel}>Damage</span>
            </div>
          </>
        )}
        
        {disaster.responseStatus && (
          <>
            <div style={styles.divider}></div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>
                {disaster.responseStatus}
              </span>
              <span style={styles.statLabel}>Response</span>
            </div>
          </>
        )}
      </div>
      
      {disaster.description && (
        <div style={styles.descriptionContainer}>
          <h4 style={styles.sectionTitle}>Description</h4>
          <p style={styles.description}>{disaster.description}</p>
        </div>
      )}
      
      {disaster.resources && disaster.resources.length > 0 && (
        <div style={styles.resourcesContainer}>
          <h4 style={styles.sectionTitle}>Available Resources</h4>
          <ul style={styles.resourcesList}>
            {disaster.resources.map((resource, index) => (
              <li key={index} style={styles.resourceItem}>{resource}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div style={styles.actionButtons}>
        <button style={{
          ...styles.ngoButton,
          backgroundColor: "rgba(13, 110, 253, 0.05)",
        }}
        onClick={() => navigate("/ngo")}
        >
          <i className="fa-solid fa-hand-holding-heart" style={styles.buttonIcon}></i>
          NGO
        </button>
        <button style={{
          ...styles.helpButton,
          backgroundColor: "rgba(220, 53, 69, 0.05)",
        }}
        onClick={() => navigate("/help")}
        >
          <i className="fa-solid fa-kit-medical" style={styles.buttonIcon}></i>
          Need Help
        </button>
      </div>
      
      {disaster.url && (
        <div style={styles.urlContainer}>
          <a href={disaster.url} target="_blank" rel="noopener noreferrer" style={styles.urlLink}>
            <i className="fa-solid fa-external-link" style={styles.urlIcon}></i>
            View Source
          </a>
        </div>
      )}
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: "rgba(25, 25, 35, 0.7)",
    borderRadius: "16px",
    padding: "22px",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    border: "1px solid",
    backdropFilter: "blur(10px)",
    transition: "all 0.3s ease",
    position: "relative",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "15px",
  },
  dateLabel: {
    display: "flex",
    alignItems: "center",
    fontSize: "13px",
    color: "#b0b7c1",
    padding: "4px 8px",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: "15px",
  },
  dateIcon: {
    marginRight: "6px",
    fontSize: "11px",
  },
  cardHeader: {
    marginBottom: "15px",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "700",
    lineHeight: "1.3",
  },
  severityBadge: {
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600",
    color: "white",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  locationContainer: {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
    color: "#b0b7c1",
  },
  locationIcon: {
    marginRight: "6px",
    color: "#b0b7c1",
    fontSize: "14px",
  },
  location: {
    fontSize: "14px",
  },
  categoryContainer: {
    marginBottom: "16px",
  },
  categoryBadge: {
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
  },
  categoryIcon: {
    marginRight: "6px",
    fontSize: "12px",
  },
  summaryContainer: {
    marginBottom: "20px",
  },
  summary: {
    fontSize: "15px",
    lineHeight: "1.5",
    color: "#e1e5ea",
    margin: 0,
  },
  dataField: {
    display: "flex",
    alignItems: "center",
    marginBottom: "12px",
    padding: "8px 12px",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: "8px",
  },
  dataLabel: {
    fontWeight: "600",
    fontSize: "14px",
    color: "#b0b7c1",
    marginRight: "8px",
  },
  dataValue: {
    fontSize: "14px",
    color: "#ffffff",
  },
  strategyContainer: {
    marginBottom: "20px",
    padding: "15px",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  strategyText: {
    fontSize: "14px",
    lineHeight: "1.5",
    color: "#e1e5ea",
    margin: 0,
  },
  statsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    padding: "12px",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: "12px",
  },
  statItem: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
  },
  statValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "11px",
    color: "#b0b7c1",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  divider: {
    width: "1px",
    height: "30px",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  imageContainer: {
    width: "100%",
    borderRadius: "8px",
    overflow: "hidden",
    marginBottom: "15px",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  disasterImage: {
    width: "100%",
    height: "auto",
    maxHeight: "300px",
    objectFit: "cover",
  },
  descriptionContainer: {
    marginBottom: "15px",
    padding: "15px",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  sectionTitle: {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "8px",
    color: "#e1e5ea",
  },
  description: {
    fontSize: "14px",
    lineHeight: "1.5",
    color: "#e1e5ea",
    margin: 0,
  },
  resourcesContainer: {
    marginBottom: "15px",
    padding: "15px",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.05)",
  },
  resourcesList: {
    margin: 0,
    padding: "0 0 0 20px",
  },
  resourceItem: {
    fontSize: "14px",
    color: "#e1e5ea",
    marginBottom: "5px",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "12px",
  },
  ngoButton: {
    flex: 1,
    padding: "10px 0",
    color: "#0d6efd",
    border: "1px solid rgba(13, 110, 253, 0.3)",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "all 0.2s ease",
  },
  helpButton: {
    flex: 1,
    padding: "10px 0",
    color: "#dc3545",
    border: "1px solid rgba(220, 53, 69, 0.3)",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "all 0.2s ease",
  },
  buttonIcon: {
    marginRight: "6px",
    fontSize: "13px",
  },
  urlContainer: {
    textAlign: "center",
  },
  urlLink: {
    color: "#b0b7c1",
    fontSize: "14px",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    transition: "all 0.2s ease",
  },
  urlIcon: {
    marginRight: "6px",
    fontSize: "12px",
  }
}

// Add animations and hover effects with JavaScript
document.head.insertAdjacentHTML(
  "beforeend",
  `<style>
    @keyframes cardHover {
      0% { transform: translateY(0); }
      100% { transform: translateY(-5px); }
    }
  </style>`
)

// Add event listeners on mount
const addHoverEffects = () => {
  const cards = document.querySelectorAll('[style*="styles.card"]')
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-5px)'
      card.style.boxShadow = card.style.boxShadow.replace('0 10px 25px', '0 15px 35px')
    })
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)'
      card.style.boxShadow = card.style.boxShadow.replace('0 15px 35px', '0 10px 25px')
    })
  })
  
  const buttons = document.querySelectorAll('[style*="styles.ngoButton"], [style*="styles.helpButton"]')
  buttons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      const originalBg = button.style.backgroundColor
      const brighterBg = originalBg.replace('0.05', '0.1').replace('0.1', '0.15')
      button.style.backgroundColor = brighterBg
    })
    button.addEventListener('mouseleave', () => {
      const originalBg = button.style.backgroundColor
      const dimmerBg = originalBg.replace('0.15', '0.1').replace('0.1', '0.05')
      button.style.backgroundColor = dimmerBg
    })
  })
  
  const urlLinks = document.querySelectorAll('[style*="styles.urlLink"]')
  urlLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      link.style.color = "#ffffff"
    })
    link.addEventListener('mouseleave', () => {
      link.style.color = "#b0b7c1"
    })
  })
}

// Execute after component mounts
if (typeof window !== 'undefined') {
  // Run on next tick to ensure DOM is ready
  setTimeout(addHoverEffects, 0)
}

export default DisasterCard;