A web front-end for Myria
=========================

This is a Google App Engine app.

# Dependencies

You must have the [Google App Engine SDK](https://developers.google.com/App Engine/downloads) installed locally.  During setup, be sure to select the option to create symbolic links to the Python utilities so that they are available from the command line.

# Initial setup
1. This project uses the [UW eScience Datalogcompiler](https://github.com/uwescience/datalogcompiler) project. We have configured it as a submodule. After cloning this repository, you must run:

  ```sh
  git submodule init
  git submodule update
  ```

2. Launch the local App Engine emulator. I prefer to use Google's `GoogleApp EngineLauncher` application (installed with the SDK), which provides a nice GUI interface to control the emulator. 

  Alternatively, from the command line, you may launch:
  
  ```sh
  dev_appserver.py App Engine
  ```

  And then point your browser at `localhost:8080` to view the application.

# Updating the code

To update the submodule to the latest from master, run this code:

```sh
git submodule update --recursive --remote
```
