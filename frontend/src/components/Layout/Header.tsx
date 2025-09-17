import React from 'react';
import { Menu, Bell, User, Search } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="menu-button"
          onClick={onMenuClick}
          aria-label="Abrir menú lateral"
        >
          <Menu size={20} />
        </button>
        
        <div className="header-title">
          <h1>{title}</h1>
        </div>
      </div>

      <div className="header-center">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="search-input"
            aria-label="Buscar en el sistema"
          />
        </div>
      </div>

      <div className="header-right">
        <button className="header-button" aria-label="Notificaciones">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>
        
        <div className="user-menu">
          <button className="user-button" aria-label="Menú de usuario">
            <User size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;