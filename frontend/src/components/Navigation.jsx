import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Button,
  Avatar,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { removeToken } from '../utils/auth';

export default function Navigation() {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  return (
    <AppBar position="static" className="bg-blue-600">
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          className="mr-2"
        >
          <MenuIcon />
        </IconButton>
        
        <Typography variant="h6" component="div" className="flex-grow">
          ShadowMe
        </Typography>

        <Box className="flex items-center gap-4">
          <Button color="inherit" component={Link} to="/dashboard">
            Dashboard
          </Button>
          <Button color="inherit" component={Link} to="/goals">
            Goals
          </Button>
          <Button color="inherit" component={Link} to="/challenges">
            Challenges
          </Button>
          
          <IconButton
            onClick={handleMenu}
            color="inherit"
          >
            <Avatar className="bg-blue-400">
              {/* User's initial or avatar */}
              U
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
              Settings
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}