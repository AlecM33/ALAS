import React, { Component } from 'react';
import SearchBar from 'material-ui-search-bar'
import {Panel, PanelGroup, ProgressBar} from 'react-bootstrap';
import {getActionsByPIid, getParentEmailByPIid, getPatients} from "../session/Session";
import ClinicianComponent from "./ClinicianComponent";
import './ClinicianView.css';

class ClinicianView extends Component {
    constructor(props) {
        super(props);

        this.state = {
            Patient_Info: {}, // PIid: Patient_Info {}
            Actions: {}, // PIid: Actions []
            parentEmails: {}, // PIid: parentEmail ""
            activeKey: '',
            lastSearch: '',
        };

        this.handleSelect = this.handleSelect.bind(this);
    }

    componentDidMount() {
        this.updatePatientsBySearch('');
    }

    handleSelect(activeKey) {
        this.setState({ activeKey });
    }

    handleToggle() {
        const { lastSearch } = this.state;
        this.updatePatientsBySearch(lastSearch);
    }

    updatePatientsBySearch(search) {
        console.log("setting lastSearch to " + search);
        this.setState({
            lastSearch: search
        });

        getPatients()
            .then(patients => patients.json())
            .then(patientsJson => {
                let Patient_Info = {};
                for (const index in patientsJson) {
                    const patientName = (patientsJson[index].Fname + ' ' + patientsJson[index].Lname).toLowerCase();
                    if (patientName.includes(search.toLowerCase())) {
                        Patient_Info[patientsJson[index].PIid] = patientsJson[index];
                    }
                }

                if (typeof Patient_Info !== 'undefined') {
                    this.setState({
                        Patient_Info
                    });
                }

                // Fill Actions and parentEmail for each patient
                Object.keys(Patient_Info).map((PIid) => {
                    getActionsByPIid(PIid)
                        .then(actions => actions.json())
                        .then(actionsJson => {
                            const Actions = Object.assign(this.state.Actions);
                            Actions[PIid] = actionsJson;
                            this.setState({
                                Actions
                            });
                        });

                    getParentEmailByPIid(PIid)
                        .then(email => email.json())
                        .then(emailJson => {
                            const parentEmails = Object.assign(this.state.parentEmails);
                            parentEmails[PIid] = emailJson[0].Email;
                            this.setState({
                                parentEmails
                            });
                        });
                });
            });
    }

    createPanelBodyByPIid(PIid) {
        const { Actions, parentEmails } = this.state;
        const parentEmail = parentEmails[PIid];
        const actions = Actions[PIid];

        return (
            <div>
                <a href={'mailto:' + parentEmail} className={'panel-contact-link'}>Contact parent</a><br/>
                {typeof actions !== 'undefined' &&
                    actions.map(action => {
                        return <ClinicianComponent action={action} onToggle={() => this.handleToggle(this.state.lastSearch)}/>
                    })
                }
            </div>
        );
    }

    createPanelFromPatient(PIid) {
        const { Patient_Info, Actions } = this.state;
        const patientName = Patient_Info[PIid].Fname + ' ' + Patient_Info[PIid].Lname;

        // calculate number of completed and total actions associated with a PIid
        let i = 0, numActions = 0, numCompleted = 0;
        const patientActions = Actions[PIid];

        if (typeof patientActions !== 'undefined') {
            for (i; i < patientActions.length; i++) {
                numActions++;
                if (patientActions[i].IsCompleted === 1) {
                    numCompleted++;
                }
            }
        }

        // Create progress bar
        let progressBar;
        if (typeof patientActions === 'undefined') {
            progressBar = (
                <br/>
            );
        } else if (numActions === 0) {
            progressBar = (
                <ProgressBar
                    bsStyle="warning"
                    now={100}
                    label={`No actions found`}
                />
            );
        } else if (numCompleted === 0) {
            progressBar = (
                <div>No actions have been completed</div>
            );
        } else {
            progressBar = (
                <ProgressBar
                    bsStyle="success"
                    now={(100*numCompleted/numActions).toFixed(0)}
                    label={numCompleted + ' of ' + numActions + ' actions completed.'}
                />
            );
        }

        return (
            <Panel eventKey={PIid}>
                <Panel.Heading>
                    <Panel.Title toggle>
                        {patientName}
                        <br/>
                        <br/>
                        {progressBar}
                    </Panel.Title>
                </Panel.Heading>
                <Panel.Body collapsible>
                    { this.createPanelBodyByPIid(PIid) }
                </Panel.Body>
            </Panel>
        );
    }

    render() {
        const { Patient_Info } = this.state;

        return (
            <div>
                <div>
                    <SearchBar
                        onChange={(search) => this.updatePatientsBySearch(search)}
                        onCancelSearch = {() => this.updatePatientsBySearch('')}
                        className={"search-bar"}
                    />
                </div>
                <div>
                    <PanelGroup
                        accordion
                        id="user-panel"
                        activeKey={this.state.activeKey}
                        onSelect={this.handleSelect}
                    >
                        {typeof Patient_Info !== 'undefined' &&
                            Object.keys(Patient_Info).map((PIid) => {
                                return this.createPanelFromPatient(PIid);
                        })}
                    </PanelGroup>
                </div>
            </div>
        );
    }
}

export default ClinicianView;
