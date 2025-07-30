import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableRow, TableHead,
  Paper, IconButton, Collapse, Box, Typography, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, Grid
} from '@mui/material';
import { KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { TEST_PATIENT_INFO } from '../../../../util/data/PatientSample.js';
import { usePatientMRN, useEncounterID } from '../../../../util/urlHelpers.js';

function ImmunizationsTabContent() {
  const [patientMRN] = usePatientMRN();
  const [enc] = useEncounterID();
  const { encounters } = TEST_PATIENT_INFO({ patientMRN });
  const initialImms = encounters?.find(x => x.id === enc)?.immunizations || [];

  // State
  const [immunizations, setImmunizations] = useState(initialImms);
  const [openGroups, setOpenGroups] = useState({});
  const [editRecord, setEditRecord] = useState(null);
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [reviewInfo, setReviewInfo] = useState({ by: null, at: null });

  // Initialize openGroups for each vaccine type
  useEffect(() => {
    const groups = immunizations.reduce((acc, rec) => {
      acc[rec.vaccine] = acc[rec.vaccine] || false;
      return acc;
    }, {});
    setOpenGroups(groups);
  }, [immunizations]);

  // Handlers
  const toggleGroup = (vaccine) => {
    setOpenGroups(prev => {
      const newState = {};
      Object.keys(prev).forEach(key => {
        newState[key] = (key === vaccine) ? !prev[key] : false;
      });
      return newState;
    });
  };

  const handleDelete = (idx) => () => {
    setImmunizations(prev => prev.filter((_, i) => i !== idx));
  };

  const handleEditOpen = (idx) => () => {
    setEditRecord({ ...immunizations[idx], index: idx });
  };

  const handleEditClose = () => setEditRecord(null);

  const handleEditSave = () => {
    setImmunizations(prev => prev.map((rec, i) => i === editRecord.index ? editRecord : rec));
    setEditRecord(null);
  };

  const handleAddOpen = () => setAddRecordOpen(true);
  const handleAddClose = () => setAddRecordOpen(false);
  const handleAddSave = () => {
    setImmunizations(prev => [...prev, newRecord]);
    setAddRecordOpen(false);
  };

  const [newRecord, setNewRecord] = useState({
    vaccine: '', received: '', dose: '', site: '', route: '', nextDue: ''
  });

  const handleReview = () => {
    const now = new Date();
    setReviewInfo({ by: 'Current User', at: now });
  };

  // Group by vaccine
  const grouped = immunizations.reduce((acc, record, idx) => {
    const key = record.vaccine;
    if (!acc[key]) acc[key] = [];
    acc[key].push({ ...record, _idx: idx });
    return acc;
  }, {});

  // Format last review
  const formatDate = (date) => date.toLocaleDateString();
  const formatTime = (date) => date.toLocaleTimeString();

  return (
    <Paper>
      <TableContainer>
        <Table aria-label="immunizations table">
          <TableHead>
            <TableRow>
              <TableCell style={{ width: '5%' }} />
              <TableCell><Typography variant="h6">Immunization Family</Typography></TableCell>
              <TableCell><Typography variant="h6">Admin Dates</Typography></TableCell>
              <TableCell><Typography variant="h6">Next Due</Typography></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(grouped).map(([vaccine, records]) => {
              const adminDates = records.map(r => r.received).join(', ');
              const nextDue = records[0]?.nextDue || '';
              return (
                <React.Fragment key={vaccine}>
                  <TableRow hover onClick={() => toggleGroup(vaccine)}>
                    <TableCell>
                      <IconButton>
                        {openGroups[vaccine] ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
                      </IconButton>
                    </TableCell>
                    <TableCell>{vaccine}</TableCell>
                    <TableCell>{adminDates}</TableCell>
                    <TableCell>{nextDue}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ padding: 0 }} colSpan={4}>
                      <Collapse in={openGroups[vaccine]} timeout="auto" unmountOnExit>
                        <Box margin={1}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Dose</TableCell>
                                <TableCell>Site</TableCell>
                                <TableCell>Route</TableCell>
                                <TableCell align="right">Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {records.map((record) => (
                                <TableRow key={record._idx}>
                                  <TableCell>{record.received}</TableCell>
                                  <TableCell>{record.vaccine}</TableCell>
                                  <TableCell>{record.dose}</TableCell>
                                  <TableCell>{record.site}</TableCell>
                                  <TableCell>{record.route}</TableCell>
                                  <TableCell align="right">
                                    <Button size="small" onClick={handleEditOpen(record._idx)}>Edit</Button>
                                    <Button size="small" onClick={handleDelete(record._idx)}>Delete</Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" justifyContent="space-between" alignItems="center" m={2}>
        <Button variant="contained" onClick={handleAddOpen}>Add Immunization</Button>
        <Box>
          <Button variant="outlined" onClick={handleReview}>Mark as Reviewed</Button>
          {reviewInfo.at && (
            <Typography variant="body2" style={{ marginLeft: 16, display: 'inline' }}>
              Last reviewed by {reviewInfo.by} on {formatDate(reviewInfo.at)} at {formatTime(reviewInfo.at)}
            </Typography>
          )}
        </Box>
      </Box>

      {/* Edit Dialog */}
      <Dialog open={!!editRecord} onClose={handleEditClose}>
        <DialogTitle>Edit Immunization</DialogTitle>
        <DialogContent>
          {editRecord && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Name" fullWidth value={editRecord.vaccine} disabled />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Date" type="date" fullWidth
                  value={editRecord.received}
                  onChange={e => setEditRecord({ ...editRecord, received: e.target.value })}
                  InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Dose" fullWidth
                  value={editRecord.dose}
                  onChange={e => setEditRecord({ ...editRecord, dose: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Site" fullWidth
                  value={editRecord.site}
                  onChange={e => setEditRecord({ ...editRecord, site: e.target.value })} />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Route" fullWidth
                  value={editRecord.route}
                  onChange={e => setEditRecord({ ...editRecord, route: e.target.value })} />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSave}>Accept</Button>
        </DialogActions>
      </Dialog>

      {/* Add Dialog */}
      <Dialog open={addRecordOpen} onClose={handleAddClose}>
        <DialogTitle>Add New Immunization</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField label="Name" fullWidth
                value={newRecord.vaccine}
                onChange={e => setNewRecord({ ...newRecord, vaccine: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Date" type="date" fullWidth
                value={newRecord.received}
                onChange={e => setNewRecord({ ...newRecord, received: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Dose" fullWidth
                value={newRecord.dose}
                onChange={e => setNewRecord({ ...newRecord, dose: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Site" fullWidth
                value={newRecord.site}
                onChange={e => setNewRecord({ ...newRecord, site: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label="Route" fullWidth
                value={newRecord.route}
                onChange={e => setNewRecord({ ...newRecord, route: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Next Due" type="date" fullWidth
                value={newRecord.nextDue}
                onChange={e => setNewRecord({ ...newRecord, nextDue: e.target.value })}
                InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddClose}>Cancel</Button>
          <Button onClick={handleAddSave}>Accept</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default ImmunizationsTabContent;