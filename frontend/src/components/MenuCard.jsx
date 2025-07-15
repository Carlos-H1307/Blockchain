import React from 'react';
import { Button, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const MenuCard = ({ title, description, path, icon, imgPath }) => {
  return (
    <Card style={{ width: '18rem' }}>
        <Card.Img variant="top" src={imgPath} />
        <Card.Body>
            <Card.Title>{title}</Card.Title>
            <Card.Text>{description}</Card.Text>
            <Link to={path}>
                <Button variant="primary">Jogar</Button>
            </Link>
        </Card.Body>
    </Card>
  );
};



export default MenuCard;