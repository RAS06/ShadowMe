import React from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import Navigation from './Navigation';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <Container maxWidth="lg" className="py-8">
        {/* Welcome Section */}
        <Paper className="mb-8 p-6 bg-white shadow-md">
          <Typography variant="h4" className="mb-2">
            Welcome back!
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Track your progress and take on new challenges
          </Typography>
        </Paper>

        <Grid container spacing={4}>
          {/* Goals Section */}
          <Grid item xs={12} md={6}>
            <Card className="h-full">
              <CardContent>
                <Typography variant="h6" className="mb-4">
                  Current Goals
                </Typography>
                
                {/* Placeholder for Goals */}
                <Box className="space-y-4">
                  <Paper className="p-4 bg-gray-50">
                    <Typography variant="subtitle1">Complete 5 Coding Challenges</Typography>
                    <Box className="flex items-center mt-2">
                      <CircularProgress 
                        variant="determinate" 
                        value={60} 
                        size={24} 
                        className="mr-2"
                      />
                      <Typography variant="body2">3/5 completed</Typography>
                    </Box>
                  </Paper>
                  
                  <Paper className="p-4 bg-gray-50">
                    <Typography variant="subtitle1">Learn React Hooks</Typography>
                    <Box className="flex items-center mt-2">
                      <CircularProgress 
                        variant="determinate" 
                        value={40} 
                        size={24} 
                        className="mr-2"
                      />
                      <Typography variant="body2">2/5 concepts mastered</Typography>
                    </Box>
                  </Paper>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Challenges Section */}
          <Grid item xs={12} md={6}>
            <Card className="h-full">
              <CardContent>
                <Typography variant="h6" className="mb-4">
                  Active Challenges
                </Typography>
                
                {/* Placeholder for Challenges */}
                <Box className="space-y-4">
                  <Paper className="p-4 bg-gray-50">
                    <Typography variant="subtitle1">30 Days of Coding</Typography>
                    <Typography variant="body2" color="textSecondary" className="mt-1">
                      Day 15/30 - Keep going!
                    </Typography>
                  </Paper>
                  
                  <Paper className="p-4 bg-gray-50">
                    <Typography variant="subtitle1">Full Stack Project</Typography>
                    <Typography variant="body2" color="textSecondary" className="mt-1">
                      2 milestones remaining
                    </Typography>
                  </Paper>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
}