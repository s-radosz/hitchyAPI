import React, { Component } from "react";
import axios from "axios";
import Comment from "./SingleMeetingComponents/Comment";
import CommentForm from "./SingleMeetingComponents/CommentForm";
import MapComponent from "./../Map/MapComponent.js";
import { store } from "./../../store";
import Animate from "react-smooth";

class SingleMeetingDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      usersEmails: [],
      resignedUsersEmails: [],
      loggedInUserEmail: "",
      loggedInUserNickname: "",
      displayTakPartBtn: false,
      displayResignBtn: false,
      displayCommentsContainer: false,
      checkIfUserTakePartInMeeting: false,
      startLat: "",
      currentUserId: 0,
      currentUserNickName: "",
      currentUserEmail: "",
      startLng: "",
      stopLat: "",
      stopLng: "",
      comments: [],
      commentBody: "",
      centerCoord: []
    };

    this.setNewCenterCoords = this.setNewCenterCoords.bind(this);
    this.takePartClick = this.takePartClick.bind(this);
    this.resignClick = this.resignClick.bind(this);
    this.addCommentToState = this.addCommentToState.bind(this);
    this.loggedInUserInfo = this.loggedInUserInfo.bind(this);
    this.getCurrentMeetingLimit = this.getCurrentMeetingLimit.bind(this);
    this.getResignedUsersList = this.getResignedUsersList.bind(this);
    //this.getCurrentMeetingAuthor = this.getCurrentMeetingAuthor.bind(this);
    this.getCurrentMeetingComments = this.getCurrentMeetingComments.bind(this);
    this.checkIfUserTakePartInMeeting = this.checkIfUserTakePartInMeeting.bind(
      this
    );
  }

  handleChange(event) {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  }

  setNewCenterCoords(lat, lng) {
    this.setState({ centerCoord: [lat, lng] });
  }

  addCommentToState(userNickname, commentDate, commentBody) {
    let commentObject = {
      userEmail: userNickname,
      date: commentDate,
      commentBody: commentBody
    };

    //console.log(commentObject);

    this.setState(prevState => ({
      comments: [...prevState.comments, commentObject]
    }));
  }

  async loggedInUserInfo() {
    const getUser = await axios.get(
      `http://127.0.0.1:8000/api/user/${this.state.currentUserId}`
    );

    this.setState({ loggedInUserEmail: getUser.data[0].email });
    this.setState({ loggedInUserNickname: getUser.data[0].nickName });
  }

  async getCurrentMeetingLimit() {
    const getCurrentMeetingInfo = await axios.get(
      `http://127.0.0.1:8000/api/events/${this.props.meetingId}`
    );

    return getCurrentMeetingInfo.data[0].limit;
  }

  /*async getCurrentMeetingAuthor() {
    const getCurrentMeetingInfo = await axios.get(
      `http://127.0.0.1:8000/api/events/${this.props.meetingId}`
    );

    return getCurrentMeetingInfo.data[0].authorNickName;
  }*/

  async getResignedUsersList() {
    const allDeleted = await axios.get(
      `http://127.0.0.1:8000/api/deleteUserFromMeeting/${this.props.meetingId}`
    );

    allDeleted.data.map((singleDeletedUserFromMeeting, i) => {
      this.setState(prevState => ({
        resignedUsersEmails: [
          ...prevState.resignedUsersEmails,
          singleDeletedUserFromMeeting[0].email
        ]
      }));
    });
  }

  async getCurrentMeetingComments() {
    const allComments = await axios.get(`http://127.0.0.1:8000/api/comments`);

    allComments.data.map((comment, i) => {
      if (comment.meetingId == this.props.meetingId) {
        let commentObject = {
          userID: comment.userId,
          userEmail: comment.userEmail,
          date: comment.created_at,
          commentBody: comment.commentBody
        };

        this.setState(prevState => ({
          comments: [...prevState.comments, commentObject]
        }));
      }
    });
  }

  async checkIfUserTakePartInMeeting() {
    let response;

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/api/checkIfUserTakePartInMeeting`,
        {
          userId: this.state.currentUserId,
          meetingId: this.props.meetingId
        }
      );

      //console.log(response.data);

      if (response.data == 1) {
        this.setState({
          displayTakPartBtn: false,
          displayCommentsContainer: true,
          displayResignBtn: true
        });
      }
    } catch (err) {
      console.log(err);
    }
  }

  async takePartClick() {
    let takePart = true;

    const allMatches = await axios.get(
      `http://127.0.0.1:8000/api/matchUserWithMeetings`
    );

    allMatches.data.map(singleMatchUserWithMeeting => {
      if (
        singleMatchUserWithMeeting.userId == this.state.currentUserId &&
        singleMatchUserWithMeeting.eventId == this.props.meetingID
      ) {
        takePart = false;
      }
    });

    if (takePart == false) {
      this.props.showAlertWarning(
        "Użytkownik " + this.state.loggedInUserEmail + " wziął już udział!"
      );
    } else {
      const savedMatchUserWithMeeting = await axios.post(
        `http://127.0.0.1:8000/api/matchUserWithMeeting`,
        {
          userId: this.state.currentUserId,
          eventId: this.props.meetingId
        }
      );

      if (savedMatchUserWithMeeting.status == "200") {
        const user = await axios.get(
          `http://127.0.0.1:8000/api/user/${this.state.currentUserId}`
        );

        if (user.status == 200) {
          let userObject = {
            email: user.data[0].email,
            id: user.data[0].id
          };

          this.setState(prevState => ({
            usersEmails: [...prevState.usersEmails, userObject]
          }));

          this.setState({
            displayTakPartBtn: false,
            displayResignBtn: true,
            displayCommentsContainer: true
          });

          this.props.showAlertSuccess(
            "Wziąłeś udział w wydarzeniu. Możesz dodawać komentarze."
          );
        } else {
          this.props.showAlertWarning(
            "Nie można dodać użytkownika do spotkania."
          );
        }
      } else {
        this.props.showAlertWarning(
          "Błąd. Nie można dodać użytkownika do spotkania."
        );
      }
    }
  }

  async resignClick() {
    const allMatches = await axios.get(
      `http://127.0.0.1:8000/api/matchUserWithMeetings`
    );

    allMatches.data.map(async (singleMatchUserWithMeeting, i) => {
      if (
        singleMatchUserWithMeeting.userId == this.state.currentUserId &&
        singleMatchUserWithMeeting.eventId == this.props.meetingId
      ) {
        const deletedUserFromMatchUserWithEventTable = await axios.delete(
          `http://127.0.0.1:8000/api/deleteMatchUserWithMeeting/${
            singleMatchUserWithMeeting.id
          }`,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded"
            }
          }
        );

        if (deletedUserFromMatchUserWithEventTable.status == "200") {
          const savedDeleteUserFromMeeting = await axios.post(
            `http://127.0.0.1:8000/api/deleteUserFromMeeting`,
            {
              userId: this.state.currentUserId,
              meetingId: this.props.meetingId
            }
          );

          if (savedDeleteUserFromMeeting.status == "200") {
            this.props.showAlertSuccess("Szkoda, że rezygnujesz.");

            this.setState({
              displayTakPartBtn: true,
              displayResignBtn: false,
              displayCommentsContainer: false
            });

            const updatedResignedUsersEmailsList = [
              ...this.state.resignedUsersEmails
            ];

            //console.log(updatedResignedUsersEmailsList);

            if (updatedResignedUsersEmailsList.length == 0) {
              this.setState(prevState => ({
                resignedUsersEmails: [
                  ...prevState.resignedUsersEmails,
                  this.state.currentUserEmail
                ]
              }));
            } else {
              updatedResignedUsersEmailsList.map((email, i) => {
                //console.log(email);
                if (email != this.state.currentUserId) {
                  this.setState(prevState => ({
                    resignedUsersEmails: [
                      ...prevState.resignedUsersEmails,
                      this.state.currentUserEmail
                    ]
                  }));
                }
              });
            }

            const updatedUsersList = [...this.state.usersEmails];

            updatedUsersList.map((emailElement, i) => {
              if (emailElement.email == this.state.currentUserEmail) {
                updatedUsersList.splice(i, 1);
              }
            });

            this.setState({ usersEmails: updatedUsersList });
          } else {
            this.props.showAlertWarning(
              "Problem z usunięciem użytkownika ze spotkania."
            );
          }
        } else {
          this.props.showAlertWarning(
            "Problem z usunięciem użytkownika z tabeli match_user_with_meeting."
          );
        }
      }
    });
  }

  async componentDidMount() {
    this.props.switchLoader(true);

    let storeData = store.getState();

    if (storeData.user.user.userId) {
      await this.setState({
        currentUserId: storeData.user.user.userId,
        currentUserEmail: storeData.user.user.userEmail,
        currentUserNickName: storeData.user.user.userNickName,
        startLat: this.props.startPlaceLattitude,
        startLng: this.props.startPlaceLongitude,
        stopLat: this.props.stopPlaceLattitude,
        stopLng: this.props.stopPlaceLongitude
      });

      await this.checkIfUserTakePartInMeeting();

      await this.loggedInUserInfo();
    } else {
      await this.setState({
        startLat: this.props.startPlaceLattitude,
        startLng: this.props.startPlaceLongitude,
        stopLat: this.props.stopPlaceLattitude,
        stopLng: this.props.stopPlaceLongitude
      });
    }

    let meetingLimit = await this.getCurrentMeetingLimit();

    let usersIDs = [];

    const allMatches = await axios.get(
      `http://127.0.0.1:8000/api/matchUserWithMeetings`
    );

    let meetingMatched = 0;

    allMatches.data.map((singleMatch, i) => {
      if (singleMatch.eventId == this.props.meetingId) {
        usersIDs.push(singleMatch.userId);
        meetingMatched++;

        if (
          singleMatch.userId == this.state.currentUserId &&
          this.state.currentUserNickName != this.props.author
        ) {
          this.setState({ displayTakPartBtn: false });
          this.setState({ displayCommentsContainer: true });
          this.setState({ displayResignBtn: true });
        }
      }
    });

    if (meetingMatched < meetingLimit) {
      this.setState({ displayTakPartBtn: true });
    }

    usersIDs.map(async (userId, i) => {
      //console.log(userId);
      const allUsers = await axios.get(`http://127.0.0.1:8000/api/users`);

      allUsers.data.map((singleUser, i) => {
        if (singleUser.id == parseInt(userId)) {
          let userObject = {
            email: singleUser.email,
            id: singleUser.id
          };

          this.setState(prevState => ({
            usersEmails: [...prevState.usersEmails, userObject]
          }));
        } else {
          console.log("cant map user id");
        }
      });
    });

    await this.getResignedUsersList();

    await this.getCurrentMeetingComments();

    this.props.switchLoader(false);
  }

  render() {
    return (
      <div className="register row singleMeetingDetailsDataRow">
        <div className="col-sm-6 singleMeetingDetailsDataCol">
          <Animate steps={this.props.animationSteps}>
            <div>
              <h2>
                {this.props.title} - {this.props.date}{" "}
              </h2>

              <div
                className="btn btn-default"
                onClick={() => {
                  this.setNewCenterCoords(
                    this.state.startLat,
                    this.state.startLng
                  );
                }}
              >
                Punkt Startowy
              </div>

              <div
                className="btn btn-default"
                onClick={() => {
                  this.setNewCenterCoords(
                    this.state.stopLat,
                    this.state.stopLng
                  );
                }}
              >
                Punkt Końcowy
              </div>

              <p>
                <strong>Opis:</strong> {this.props.description}
              </p>

              <p>
                <strong>Stworzone przez:</strong> {this.props.author}
              </p>

              <p>
                <strong>Limit uczestników:</strong> {this.props.limit}{" "}
                {this.state.usersEmails.length == this.props.limit
                  ? " (osiągnięto limit)"
                  : ""}
              </p>

              <p>
                <strong>Wezmą udział:</strong>
              </p>

              {this.state.usersEmails.map((user, i) => {
                return <p key={i}>{user.email}</p>;
              })}

              {this.state.resignedUsersEmails.length > 0 && (
                <p>
                  <strong>Użytkownicy, którzy zrezygnowali:</strong>
                </p>
              )}

              {this.state.resignedUsersEmails.map((userEmail, i) => {
                return <p key={i}>{userEmail}</p>;
              })}

              {this.state.displayTakPartBtn &&
              this.props.author != this.state.currentUserNickName ? (
                <div className="btn btn-default" onClick={this.takePartClick}>
                  Weź udział
                </div>
              ) : (
                ""
              )}

              {this.state.displayResignBtn &&
              this.props.author != this.state.currentUserNickName ? (
                <div className="btn btn-default" onClick={this.resignClick}>
                  Zrezygnuj
                </div>
              ) : (
                ""
              )}

              {this.state.displayCommentsContainer && (
                <p>
                  <strong>Komentarze</strong>
                </p>
              )}

              {this.state.displayCommentsContainer
                ? this.state.comments.map((comment, i) => {
                    return (
                      <Comment
                        key={i}
                        userNickname={comment.userEmail}
                        date={comment.date}
                        commentBody={comment.commentBody}
                      />
                    );
                  })
                : ""}

              {this.state.displayCommentsContainer && (
                <CommentForm
                  loggedInUserEmail={this.state.loggedInUserEmail}
                  loggedInUserNickname={this.state.loggedInUserNickname}
                  meetingId={this.props.meetingId}
                  addCommentToState={this.addCommentToState}
                  showAlertSuccess={this.props.showAlertSuccess}
                  showAlertWarning={this.props.showAlertWarning}
                />
              )}
            </div>
          </Animate>
        </div>

        <div className="col-sm-6 meetingMapContainer">
          <MapComponent
            latCenter={this.props.startPlaceLattitude}
            lngCenter={this.props.startPlaceLongitude}
            allowDragableMarker={false}
            displayFirstMarker={true}
            displaySecondMarker={true}
            secondLatCenter={this.props.stopPlaceLattitude}
            secondLngCenter={this.props.stopPlaceLongitude}
            centerCoord={this.state.centerCoord}
            hideSearchBox={true}
          />
        </div>
      </div>
    );
  }
}
export default SingleMeetingDetails;
