import React, { Component } from "react";
import axios from "axios";
import UserInfo from "./UserInfo";

class MainProfile extends Component {
  constructor(props) {
    super(props);

    this.state = {
      firstName: "",
      lastName: "",
      age: "",
      description: "",
      nickName: "",
      location: "",
      userExist: false
    };
  }

  async componentDidMount() {
    const nickname = this.props.match.params.nickname;
    const allUsers = await axios.get(`http://127.0.0.1:8000/api/users`);

    for (var i = 0; i < allUsers.data.length; i++) {
      if (allUsers.data[i].nickName == nickname) {
        this.setState({
          userExist: true,
          firstName: allUsers.data[i].firstName,
          lastName: allUsers.data[i].lastName,
          nickName: allUsers.data[i].nickName,
          age: allUsers.data[i].age,
          description: allUsers.data[i].about,
          location: allUsers.data[i].city
        });
      }
    }
  }

  render() {
    console.log(this.props.match.params.nickname);
    return (
      <div className="col-sm-6 col-sm-offset-3">
        {this.state.userExist &&
          <UserInfo nickName={this.state.nickName} firstName={this.state.firstName} lastName={this.state.lastName} age={this.state.age} location={this.state.location} />
         }
      </div>
    );
  }
}

export default MainProfile;
