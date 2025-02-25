import React from 'react';
import Header from './Header';
import Container from './Container';
import Footer from './Footer';
import './Style.css'

function HomePage() {
  return (
    <div className="home-page">
      <Header />
      <Container />
      <Footer />
    </div>
  );
}

export default HomePage;
